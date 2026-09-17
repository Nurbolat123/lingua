import { relations, sql } from 'drizzle-orm';
import {
  bigserial, boolean, date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid,
} from 'drizzle-orm/pg-core';

// ── Enums ────────────────────────────────────────────────
export const roleEnum = pgEnum('role', ['STUDENT', 'PARENT', 'CURATOR', 'ADMIN']);
// PENDING_CONSENT: несовершеннолетний ждёт согласия родителя на обработку ПД
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'PENDING_CONSENT', 'BLOCKED']);
export const linkStatusEnum = pgEnum('link_status', ['ACTIVE', 'REVOKED']);
export const consentTypeEnum = pgEnum('consent_type', [
  'DATA_PROCESSING', // обработка персональных данных (обязательное)
  'VOICE_RECORDING', // запись голоса для speaking
  'CAMERA', // камера при контроле самостоятельной работы
  'MICROPHONE', // микрофон при контроле самостоятельной работы
  'MARKETING',
]);

export type Role = (typeof roleEnum.enumValues)[number];
export type UserStatus = (typeof userStatusEnum.enumValues)[number];
export type ConsentType = (typeof consentTypeEnum.enumValues)[number];

const ts = (name: string) => timestamp(name, { withTimezone: true });

// ── Users ────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    phone: text('phone').unique(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull(),
    status: userStatusEnum('status').notNull().default('ACTIVE'),
    firstName: text('first_name').notNull(),
    lastName: text('last_name'),
    locale: text('locale').notNull().default('ru'),
    lastLoginAt: ts('last_login_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index('users_role_status_idx').on(t.role, t.status)],
);

export const studentProfiles = pgTable('student_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  birthDate: date('birth_date', { mode: 'string' }).notNull(),
  isMinor: boolean('is_minor').notNull(),
  targetLevel: text('target_level'),
  goal: text('goal'),
  dailyMinutes: integer('daily_minutes').notNull().default(20),
  // Одноразовый код, который ученик передаёт родителю для привязки
  linkCode: text('link_code').unique(),
  linkCodeExpiresAt: ts('link_code_expires_at'),
});

export const parentChildLinks = pgTable(
  'parent_child_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    parentId: uuid('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    childId: uuid('child_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: linkStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: ts('created_at').notNull().defaultNow(),
    revokedAt: ts('revoked_at'),
  },
  (t) => [
    uniqueIndex('parent_child_links_pair_uq').on(t.parentId, t.childId),
    index('parent_child_links_child_idx').on(t.childId),
  ],
);

export const curatorStudents = pgTable(
  'curator_students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    curatorId: uuid('curator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    active: boolean('active').notNull().default(true),
    assignedAt: ts('assigned_at').notNull().defaultNow(),
    unassignedAt: ts('unassigned_at'),
  },
  (t) => [
    // У ученика не больше одного активного куратора
    uniqueIndex('curator_students_one_active_uq').on(t.studentId).where(sql`${t.active} = true`),
    index('curator_students_curator_idx').on(t.curatorId, t.active),
  ],
);

export const consents = pgTable(
  'consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subjectId: uuid('subject_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // чьи данные
    grantedById: uuid('granted_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // кто дал
    type: consentTypeEnum('type').notNull(),
    version: text('version').notNull(),
    grantedAt: ts('granted_at').notNull().defaultNow(),
    revokedAt: ts('revoked_at'),
  },
  (t) => [
    // Не больше одного действующего согласия каждого типа
    uniqueIndex('consents_one_active_uq').on(t.subjectId, t.type).where(sql`${t.revokedAt} IS NULL`),
  ],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    familyId: uuid('family_id').notNull(), // цепочка ротаций одной сессии
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: ts('expires_at').notNull(),
    revokedAt: ts('revoked_at'),
    replacedById: uuid('replaced_by_id'),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('refresh_tokens_user_idx').on(t.userId), index('refresh_tokens_family_idx').on(t.familyId)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    meta: jsonb('meta'),
    ip: text('ip'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_entity_idx').on(t.entity, t.entityId),
    index('audit_logs_actor_idx').on(t.actorId, t.createdAt),
  ],
);

// ── Relations ────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles),
  childLinks: many(parentChildLinks, { relationName: 'parent_side' }),
  parentLinks: many(parentChildLinks, { relationName: 'child_side' }),
  curatedStudents: many(curatorStudents, { relationName: 'curator_side' }),
  curators: many(curatorStudents, { relationName: 'student_side' }),
  consents: many(consents, { relationName: 'consent_subject' }),
  grantedConsents: many(consents, { relationName: 'consent_granter' }),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, { fields: [studentProfiles.userId], references: [users.id] }),
}));

export const parentChildLinksRelations = relations(parentChildLinks, ({ one }) => ({
  parent: one(users, { fields: [parentChildLinks.parentId], references: [users.id], relationName: 'parent_side' }),
  child: one(users, { fields: [parentChildLinks.childId], references: [users.id], relationName: 'child_side' }),
}));

export const curatorStudentsRelations = relations(curatorStudents, ({ one }) => ({
  curator: one(users, { fields: [curatorStudents.curatorId], references: [users.id], relationName: 'curator_side' }),
  student: one(users, { fields: [curatorStudents.studentId], references: [users.id], relationName: 'student_side' }),
}));

export const consentsRelations = relations(consents, ({ one }) => ({
  subject: one(users, { fields: [consents.subjectId], references: [users.id], relationName: 'consent_subject' }),
  grantedBy: one(users, { fields: [consents.grantedById], references: [users.id], relationName: 'consent_granter' }),
}));

export type User = typeof users.$inferSelect;
