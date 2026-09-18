import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gt, isNull, ne } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import { AccessService } from '../common/access.service';
import { AuditService } from '../common/audit.service';
import { AuthUser } from '../common/auth.decorators';
import { isUniqueViolation } from '../common/utils';
import { ConsentsService } from '../consents/consents.service';
import { DB, Database } from '../db/db.module';
import { consents, ConsentType, curatorStudents, parentChildLinks, skillSnapshots, studentProfiles, users } from '../db/schema';

const LINK_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без 0/O и 1/I
const LINK_CODE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PARENTS_PER_CHILD = 2;

@Injectable()
export class FamilyService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
    private readonly audit: AuditService,
    private readonly consentsService: ConsentsService,
  ) {}

  // ── Ученик ─────────────────────────────────────────────

  async createLinkCode(studentId: string) {
    const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from({ length: 8 }, () => LINK_CODE_ALPHABET[randomInt(LINK_CODE_ALPHABET.length)]).join('');
      try {
        await this.db
          .update(studentProfiles)
          .set({ linkCode: code, linkCodeExpiresAt: expiresAt })
          .where(eq(studentProfiles.userId, studentId));
        return { code, expiresAt };
      } catch (e) {
        if (!isUniqueViolation(e)) throw e;
      }
    }
    throw new ConflictException('Could not generate a code, try again');
  }

  /** Карточка ученика для любого, у кого есть к нему доступ */
  async studentSummary(actor: AuthUser, studentId: string) {
    await this.access.assertCanViewStudent(actor, studentId);
    const student = await this.db.query.users.findFirst({
      where: and(eq(users.id, studentId), eq(users.role, 'STUDENT')),
      columns: { id: true, firstName: true, lastName: true, status: true, locale: true, lastLoginAt: true, createdAt: true },
      with: {
        studentProfile: { columns: { isMinor: true, targetLevel: true, goal: true, dailyMinutes: true } },
        curators: {
          where: eq(curatorStudents.active, true),
          columns: { assignedAt: true },
          with: { curator: { columns: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    const { curators, ...rest } = student;
    return { ...rest, curator: curators[0] ? { ...curators[0].curator, assignedAt: curators[0].assignedAt } : null };
  }

  /** История баллов по навыкам (для графика динамики) — тот же доступ, что и к карточке ученика */
  async skillHistory(actor: AuthUser, studentId: string) {
    await this.access.assertCanViewStudent(actor, studentId);
    const rows = await this.db.query.skillSnapshots.findMany({
      where: eq(skillSnapshots.userId, studentId),
      columns: { skill: true, score: true, source: true, createdAt: true },
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
    return rows;
  }

  // ── Родитель ───────────────────────────────────────────

  async linkChild(parentId: string, rawCode: string, ip?: string) {
    const code = rawCode.trim().toUpperCase();
    const profile = await this.db.query.studentProfiles.findFirst({
      where: and(eq(studentProfiles.linkCode, code), gt(studentProfiles.linkCodeExpiresAt, new Date())),
      with: { user: { columns: { id: true, firstName: true, lastName: true, status: true } } },
    });
    if (!profile) throw new BadRequestException('Invalid or expired code');
    const childId = profile.userId;

    const otherParents = await this.db.$count(
      parentChildLinks,
      and(eq(parentChildLinks.childId, childId), eq(parentChildLinks.status, 'ACTIVE'), ne(parentChildLinks.parentId, parentId)),
    );
    if (otherParents >= MAX_PARENTS_PER_CHILD) throw new ConflictException('This student already has the maximum number of parents');

    await this.db.transaction(async (tx) => {
      await tx
        .insert(parentChildLinks)
        .values({ parentId, childId })
        .onConflictDoUpdate({
          target: [parentChildLinks.parentId, parentChildLinks.childId],
          set: { status: 'ACTIVE', revokedAt: null },
        });
      // Код одноразовый
      await tx.update(studentProfiles).set({ linkCode: null, linkCodeExpiresAt: null }).where(eq(studentProfiles.userId, childId));
    });

    await this.audit.log({ actorId: parentId, action: 'family.link', entity: 'user', entityId: childId, ip });
    return {
      child: { ...profile.user, isMinor: profile.isMinor },
      requiresConsent: profile.isMinor && profile.user.status === 'PENDING_CONSENT',
    };
  }

  async listChildren(parentId: string) {
    const links = await this.db.query.parentChildLinks.findMany({
      where: and(eq(parentChildLinks.parentId, parentId), eq(parentChildLinks.status, 'ACTIVE')),
      columns: { createdAt: true },
      with: {
        child: {
          columns: { id: true, firstName: true, lastName: true, status: true, lastLoginAt: true },
          with: {
            studentProfile: { columns: { isMinor: true, birthDate: true, targetLevel: true, dailyMinutes: true } },
            consents: { where: isNull(consents.revokedAt), columns: { type: true, version: true, grantedAt: true } },
          },
        },
      },
    });
    return links.map(({ child, createdAt }) => ({ ...child, linkedAt: createdAt }));
  }

  async unlinkChild(parentId: string, childId: string, ip?: string) {
    const rows = await this.db
      .update(parentChildLinks)
      .set({ status: 'REVOKED', revokedAt: new Date() })
      .where(and(eq(parentChildLinks.parentId, parentId), eq(parentChildLinks.childId, childId), eq(parentChildLinks.status, 'ACTIVE')))
      .returning({ id: parentChildLinks.id });
    if (!rows.length) throw new NotFoundException('Child not found');
    await this.audit.log({ actorId: parentId, action: 'family.unlink', entity: 'user', entityId: childId, ip });
    return { ok: true };
  }

  async grantChildConsent(parent: AuthUser, childId: string, type: ConsentType, ip?: string) {
    await this.assertParentOfMinor(parent, childId);
    return this.consentsService.grant(childId, parent.id, type, ip);
  }

  async revokeChildConsent(parent: AuthUser, childId: string, type: ConsentType, ip?: string) {
    await this.assertParentOfMinor(parent, childId);
    return this.consentsService.revoke(childId, parent.id, type, ip);
  }

  private async assertParentOfMinor(parent: AuthUser, childId: string) {
    await this.access.assertCanViewStudent(parent, childId);
    const profile = await this.db.query.studentProfiles.findFirst({
      where: eq(studentProfiles.userId, childId),
      columns: { isMinor: true },
    });
    if (!profile) throw new NotFoundException('Student not found');
    if (!profile.isMinor) throw new ForbiddenException('Adult students manage their own consents');
  }
}
