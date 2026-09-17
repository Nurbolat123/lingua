import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { and, desc, eq, ilike, isNull, or, SQL } from 'drizzle-orm';
import { TokenService } from '../auth/token.service';
import { AuditService } from '../common/audit.service';
import { escapeLike, isUniqueViolation, normalizeEmail } from '../common/utils';
import { DB, Database } from '../db/db.module';
import { consents, curatorStudents, users } from '../db/schema';
import { publicUserColumns, toPublicUser } from '../users/user.mapper';
import { AssignCuratorDto, CreateStaffDto, ListUsersQueryDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly audit: AuditService,
    private readonly tokens: TokenService,
  ) {}

  async listUsers(q: ListUsersQueryDto) {
    const conditions: (SQL | undefined)[] = [];
    if (q.role) conditions.push(eq(users.role, q.role));
    if (q.status) conditions.push(eq(users.status, q.status));
    if (q.search?.trim()) {
      const s = `%${escapeLike(q.search.trim())}%`;
      conditions.push(or(ilike(users.email, s), ilike(users.firstName, s), ilike(users.lastName, s)));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [items, total] = await Promise.all([
      this.db
        .select(publicUserColumns)
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(q.pageSize)
        .offset((q.page - 1) * q.pageSize),
      this.db.$count(users, where),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async createStaff(adminId: string, dto: CreateStaffDto, ip?: string) {
    try {
      const [user] = await this.db
        .insert(users)
        .values({
          email: normalizeEmail(dto.email),
          passwordHash: await argon2.hash(dto.password),
          role: dto.role,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName?.trim() || null,
        })
        .returning();
      await this.audit.log({ actorId: adminId, action: 'admin.create_staff', entity: 'user', entityId: user.id, meta: { role: dto.role }, ip });
      return toPublicUser(user);
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('Email already registered');
      throw e;
    }
  }

  async updateStatus(adminId: string, userId: string, requested: 'ACTIVE' | 'BLOCKED', ip?: string) {
    if (adminId === userId) throw new BadRequestException('You cannot change your own status');

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        studentProfile: { columns: { isMinor: true } },
        consents: { where: and(eq(consents.type, 'DATA_PROCESSING'), isNull(consents.revokedAt)), columns: { id: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Разблокированный несовершеннолетний без согласия возвращается в ожидание согласия
    const status =
      requested === 'ACTIVE' && user.studentProfile?.isMinor && user.consents.length === 0 ? 'PENDING_CONSENT' : requested;

    await this.db.update(users).set({ status }).where(eq(users.id, userId));
    if (status === 'BLOCKED') await this.tokens.revokeAllForUser(userId);

    await this.audit.log({ actorId: adminId, action: 'admin.update_status', entity: 'user', entityId: userId, meta: { from: user.status, to: status }, ip });
    return { id: userId, status };
  }

  async assignCurator(adminId: string, dto: AssignCuratorDto, ip?: string) {
    const [curator, student] = await Promise.all([
      this.db.query.users.findFirst({ where: eq(users.id, dto.curatorId), columns: { role: true, status: true } }),
      this.db.query.users.findFirst({ where: eq(users.id, dto.studentId), columns: { role: true } }),
    ]);
    if (curator?.role !== 'CURATOR' || curator.status === 'BLOCKED') throw new BadRequestException('curatorId must be an active curator');
    if (student?.role !== 'STUDENT') throw new BadRequestException('studentId must be a student');

    try {
      const assignment = await this.db.transaction(async (tx) => {
        await tx
          .update(curatorStudents)
          .set({ active: false, unassignedAt: new Date() })
          .where(and(eq(curatorStudents.studentId, dto.studentId), eq(curatorStudents.active, true)));
        const [row] = await tx.insert(curatorStudents).values(dto).returning();
        return row;
      });
      await this.audit.log({ actorId: adminId, action: 'admin.assign_curator', entity: 'user', entityId: dto.studentId, meta: { curatorId: dto.curatorId }, ip });
      return assignment;
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('Assignment changed concurrently, retry');
      throw e;
    }
  }

  async unassignCurator(adminId: string, studentId: string, ip?: string) {
    const rows = await this.db
      .update(curatorStudents)
      .set({ active: false, unassignedAt: new Date() })
      .where(and(eq(curatorStudents.studentId, studentId), eq(curatorStudents.active, true)))
      .returning({ curatorId: curatorStudents.curatorId });
    if (!rows.length) throw new NotFoundException('Student has no active curator');
    await this.audit.log({ actorId: adminId, action: 'admin.unassign_curator', entity: 'user', entityId: studentId, meta: { curatorId: rows[0].curatorId }, ip });
    return { ok: true };
  }
}
