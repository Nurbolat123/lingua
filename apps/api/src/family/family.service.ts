import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gt, gte, isNull, lt, ne } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import { AccessService } from '../common/access.service';
import { AuditService } from '../common/audit.service';
import { AuthUser } from '../common/auth.decorators';
import { buildEnglishProfile, SkillName, SKILLS } from '../common/levels';
import { isUniqueViolation } from '../common/utils';
import { ConsentsService } from '../consents/consents.service';
import { DB, Database } from '../db/db.module';
import {
  consents, ConsentType, curatorStudents, exercises, homework, lessonExerciseAnswers, lessonProgress, lessons,
  parentChildLinks, skillSnapshots, studentProfiles, users,
} from '../db/schema';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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

  /** Уроки ученика (посещаемость, время) — та же карточка доступа */
  async listLessons(actor: AuthUser, studentId: string) {
    await this.access.assertCanViewStudent(actor, studentId);
    const rows = await this.db.query.lessonProgress.findMany({
      where: eq(lessonProgress.userId, studentId),
      orderBy: desc(lessonProgress.updatedAt),
      with: { lesson: { columns: { title: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      lessonId: r.lessonId,
      lessonTitle: r.lesson.title,
      status: r.status,
      activeSeconds: r.activeSeconds,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      updatedAt: r.updatedAt,
    }));
  }

  /** Отчёт по конкретному уроку — как карточка на лендинге: время, баллы по навыкам, ДЗ, комментарий куратора */
  async lessonReport(actor: AuthUser, studentId: string, lessonId: string) {
    await this.access.assertCanViewStudent(actor, studentId);
    const progress = await this.db.query.lessonProgress.findFirst({
      where: and(eq(lessonProgress.userId, studentId), eq(lessonProgress.lessonId, lessonId)),
      with: { lesson: { columns: { title: true } } },
    });
    if (!progress) throw new NotFoundException('Lesson report not found');

    const answers = await this.db
      .select({ isCorrect: lessonExerciseAnswers.isCorrect, skill: exercises.skill })
      .from(lessonExerciseAnswers)
      .innerJoin(exercises, eq(lessonExerciseAnswers.exerciseId, exercises.id))
      .where(and(eq(lessonExerciseAnswers.progressId, progress.id)));

    const bySkill = new Map<string, { correct: number; total: number }>();
    for (const a of answers) {
      if (!a.skill || a.isCorrect === null) continue;
      const entry = bySkill.get(a.skill) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (a.isCorrect) entry.correct += 1;
      bySkill.set(a.skill, entry);
    }

    const hw = await this.db.query.homework.findFirst({
      where: eq(homework.lessonId, lessonId),
      columns: { id: true, title: true, status: true, reviewComment: true },
    });

    return {
      lessonId,
      lessonTitle: progress.lesson.title,
      status: progress.status,
      activeSeconds: progress.activeSeconds,
      completedAt: progress.completedAt,
      skills: [...bySkill.entries()].map(([skill, v]) => ({ skill, correct: v.correct, total: v.total })),
      homework: hw ?? null,
    };
  }

  /** Недельная сводка — уроки/минуты/ДЗ за 7 дней и изменение баллов по навыкам */
  async weeklySummary(actor: AuthUser, studentId: string) {
    await this.access.assertCanViewStudent(actor, studentId);
    const since = new Date(Date.now() - WEEK_MS);

    const recentLessons = await this.db.query.lessonProgress.findMany({
      where: and(eq(lessonProgress.userId, studentId), gte(lessonProgress.updatedAt, since)),
    });
    const lessonsCompleted = recentLessons.filter((r) => r.status === 'COMPLETED').length;
    const minutesStudied = Math.round(recentLessons.reduce((sum, r) => sum + r.activeSeconds, 0) / 60);

    const recentHomework = await this.db.query.homework.findMany({
      where: and(eq(homework.studentId, studentId), gte(homework.createdAt, since)),
      columns: { status: true },
    });
    const homeworkAssigned = recentHomework.length;
    const homeworkDone = recentHomework.filter((h) => h.status === 'REVIEWED').length;

    const profile = await this.db.query.studentProfiles.findFirst({ where: eq(studentProfiles.userId, studentId) });
    const skillColumn: Record<SkillName, keyof typeof studentProfiles.$inferSelect> = {
      GRAMMAR: 'grammarScore', VOCABULARY: 'vocabularyScore', READING: 'readingScore', LISTENING: 'listeningScore', SPEAKING: 'speakingScore',
    };
    const skillDeltas = [];
    for (const skill of SKILLS) {
      const current = (profile?.[skillColumn[skill]] as number | null) ?? null;
      // ближайший снимок ДО начала недели — если его нет, навык измерен впервые на этой неделе
      const beforeWeek = await this.db.query.skillSnapshots.findFirst({
        where: and(eq(skillSnapshots.userId, studentId), eq(skillSnapshots.skill, skill), lt(skillSnapshots.createdAt, since)),
        orderBy: desc(skillSnapshots.createdAt),
        columns: { score: true },
      });
      const startScore = beforeWeek?.score ?? null;
      skillDeltas.push({ skill, current, delta: current != null && startScore != null ? current - startScore : null });
    }

    const englishProfile = profile
      ? buildEnglishProfile({
          GRAMMAR: profile.grammarScore, VOCABULARY: profile.vocabularyScore, READING: profile.readingScore,
          LISTENING: profile.listeningScore, SPEAKING: profile.speakingScore,
        })
      : null;

    return { lessonsCompleted, minutesStudied, homeworkAssigned, homeworkDone, skillDeltas, englishProfile };
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
