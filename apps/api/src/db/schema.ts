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
  // Назначенный курс (этап 4) — подбирается автоматически по уровню/возрасту, куратор может сменить.
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  // Одноразовый код, который ученик передаёт родителю для привязки
  linkCode: text('link_code').unique(),
  linkCodeExpiresAt: ts('link_code_expires_at'),
  // Текущий английский профиль (0–100), null пока навык не измерен. История — в skillSnapshots.
  grammarScore: integer('grammar_score'),
  vocabularyScore: integer('vocabulary_score'),
  readingScore: integer('reading_score'),
  listeningScore: integer('listening_score'),
  speakingScore: integer('speaking_score'),
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
  course: one(courses, { fields: [studentProfiles.courseId], references: [courses.id] }),
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

// ── Контент (этап 2) ────────────────────────────────────────
export const audienceEnum = pgEnum('audience', ['KIDS', 'TEENS', 'ADULTS']);
export const skillEnum = pgEnum('skill', ['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'SPEAKING']);
export const lessonBlockTypeEnum = pgEnum('lesson_block_type', [
  'INTRO', 'VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'EXERCISE', 'SPEAKING', 'MINI_TEST', 'HOMEWORK',
]);
export const exerciseTypeEnum = pgEnum('exercise_type', [
  'MULTIPLE_CHOICE', 'FILL_BLANK', 'MATCHING', 'ORDERING', 'FREE_RESPONSE', 'SPEAKING',
]);

export type Audience = (typeof audienceEnum.enumValues)[number];
export type Skill = (typeof skillEnum.enumValues)[number];
export type LessonBlockType = (typeof lessonBlockTypeEnum.enumValues)[number];
export type ExerciseType = (typeof exerciseTypeEnum.enumValues)[number];

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  level: text('level').notNull(), // A1..C1 — см. common/levels.ts
  audience: audienceEnum('audience').notNull(),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const courseModules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('modules_course_idx').on(t.courseId, t.order)],
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id').notNull().references(() => courseModules.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),
    estimatedMinutes: integer('estimated_minutes').notNull().default(20),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('lessons_module_idx').on(t.moduleId, t.order)],
);

export const lessonBlocks = pgTable(
  'lesson_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
    type: lessonBlockTypeEnum('type').notNull(),
    order: integer('order').notNull().default(0),
    title: text('title'),
    // Отображаемое содержимое (текст, аудио, транскрипт...); формат зависит от type
    content: jsonb('content').notNull().default({}),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('lesson_blocks_lesson_idx').on(t.lessonId, t.order)],
);

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonBlockId: uuid('lesson_block_id').notNull().references(() => lessonBlocks.id, { onDelete: 'cascade' }),
    type: exerciseTypeEnum('type').notNull(),
    order: integer('order').notNull().default(0),
    // Вопрос, варианты, правильный ответ — вместе; при отдаче студенту ответ вырезается на сервере
    content: jsonb('content').notNull(),
    // Какой навык проверяет упражнение (этап 4) — используется для пересчёта баллов после мини-теста
    // урока (вес 0.1). Необязательное: у INTRO/HOMEWORK и т.п. упражнений без проверки не задаётся.
    skill: skillEnum('skill'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('exercises_block_idx').on(t.lessonBlockId, t.order)],
);

export const vocabularyWords = pgTable(
  'vocabulary_words',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    word: text('word').notNull(),
    translationRu: text('translation_ru').notNull(),
    translationKk: text('translation_kk'),
    definition: text('definition'),
    level: text('level').notNull(),
    transcription: text('transcription'),
    audioUrl: text('audio_url'),
    examples: jsonb('examples').notNull().default([]),
    collocations: jsonb('collocations').notNull().default([]),
    relatedWords: jsonb('related_words').notNull().default([]),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('vocabulary_level_idx').on(t.level),
    uniqueIndex('vocabulary_word_level_uq').on(t.word, t.level),
  ],
);

export const questionBank = pgTable(
  'question_bank',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    skill: skillEnum('skill').notNull(),
    level: text('level').notNull(), // 9-ступенчатая шкала — см. common/levels.ts
    difficulty: integer('difficulty').notNull().default(1), // 1–5, для полуадаптивной лестницы
    type: exerciseTypeEnum('type').notNull(),
    // Вопрос/аудио/варианты/правильный ответ — не отдаётся студенту до завершения попытки
    content: jsonb('content').notNull(),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('question_bank_skill_level_idx').on(t.skill, t.level)],
);

export const coursesRelations = relations(courses, ({ many }) => ({ modules: many(courseModules) }));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, { fields: [courseModules.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(courseModules, { fields: [lessons.moduleId], references: [courseModules.id] }),
  blocks: many(lessonBlocks),
}));

export const lessonBlocksRelations = relations(lessonBlocks, ({ one, many }) => ({
  lesson: one(lessons, { fields: [lessonBlocks.lessonId], references: [lessons.id] }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  block: one(lessonBlocks, { fields: [exercises.lessonBlockId], references: [lessonBlocks.id] }),
}));

export type Course = typeof courses.$inferSelect;
export type CourseModule = typeof courseModules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type LessonBlock = typeof lessonBlocks.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type VocabularyWord = typeof vocabularyWords.$inferSelect;
export type QuestionBankItem = typeof questionBank.$inferSelect;

// ── Placement test (этап 3) ─────────────────────────────
export const attemptStatusEnum = pgEnum('attempt_status', ['IN_PROGRESS', 'COMPLETED']);
export const skillSnapshotSourceEnum = pgEnum('skill_snapshot_source', ['PLACEMENT', 'CONTROL_TEST', 'LESSON_MINI_TEST']);

export const placementAttempts = pgTable(
  'placement_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // null = анонимная попытка (тест с лендинга без регистрации); можно "забрать" при регистрации
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    status: attemptStatusEnum('status').notNull().default('IN_PROGRESS'),
    includeSpeaking: boolean('include_speaking').notNull().default(false),
    // Текущий навык лестницы: GRAMMAR → VOCABULARY → READING → LISTENING → (SPEAKING) → null (завершено)
    currentSkill: skillEnum('current_skill').notNull().default('GRAMMAR'),
    currentLevelIndex: integer('current_level_index').notNull().default(4), // индекс в QUESTION_LEVELS, старт — B1
    // {GRAMMAR: {level, score}, VOCABULARY: {...}, ..., SPEAKING: {status: 'PENDING'|'REVIEWED', score?}}
    results: jsonb('results'),
    startedAt: ts('started_at').notNull().defaultNow(),
    completedAt: ts('completed_at'),
  },
  (t) => [index('placement_attempts_user_idx').on(t.userId)],
);

export const placementAnswers = pgTable(
  'placement_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attemptId: uuid('attempt_id').notNull().references(() => placementAttempts.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questionBank.id),
    skill: skillEnum('skill').notNull(),
    level: text('level').notNull(),
    answer: jsonb('answer'), // ответ ученика; null для speaking (там audioKey)
    audioKey: text('audio_key'), // ключ в приватном бакете speaking; presigned GET — на этапе 5 (проверка куратором)
    isCorrect: boolean('is_correct'), // null для speaking — ожидает оценки куратором
    answeredAt: ts('answered_at').notNull().defaultNow(),
  },
  (t) => [index('placement_answers_attempt_idx').on(t.attemptId)],
);

export const skillSnapshots = pgTable(
  'skill_snapshots',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    skill: skillEnum('skill').notNull(),
    score: integer('score').notNull(),
    source: skillSnapshotSourceEnum('source').notNull(),
    attemptId: uuid('attempt_id').references(() => placementAttempts.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('skill_snapshots_user_idx').on(t.userId, t.skill, t.createdAt)],
);

export const placementAttemptsRelations = relations(placementAttempts, ({ many }) => ({
  answers: many(placementAnswers),
}));

export const placementAnswersRelations = relations(placementAnswers, ({ one }) => ({
  attempt: one(placementAttempts, { fields: [placementAnswers.attemptId], references: [placementAttempts.id] }),
  question: one(questionBank, { fields: [placementAnswers.questionId], references: [questionBank.id] }),
}));

export type PlacementAttempt = typeof placementAttempts.$inferSelect;
export type PlacementAnswer = typeof placementAnswers.$inferSelect;
export type SkillSnapshot = typeof skillSnapshots.$inferSelect;

// ── Обучение (этап 4) ────────────────────────────────────
export const lessonProgressStatusEnum = pgEnum('lesson_progress_status', ['IN_PROGRESS', 'COMPLETED']);

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
    status: lessonProgressStatusEnum('status').notNull().default('IN_PROGRESS'),
    // Порядок блока (lessonBlocks.order), на котором ученик остановился — чтобы продолжить урок с того же места.
    currentBlockOrder: integer('current_block_order').notNull().default(0),
    activeSeconds: integer('active_seconds').notNull().default(0),
    startedAt: ts('started_at').notNull().defaultNow(),
    completedAt: ts('completed_at'),
  },
  (t) => [
    uniqueIndex('lesson_progress_user_lesson_uq').on(t.userId, t.lessonId),
    index('lesson_progress_user_idx').on(t.userId),
  ],
);

export const lessonExerciseAnswers = pgTable(
  'lesson_exercise_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    progressId: uuid('progress_id').notNull().references(() => lessonProgress.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
    answer: jsonb('answer'),
    audioKey: text('audio_key'), // ключ в приватном бакете speaking, для SPEAKING-упражнений
    isCorrect: boolean('is_correct'), // null — не проверяется автоматически (FREE_RESPONSE, SPEAKING)
    answeredAt: ts('answered_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('lesson_exercise_answers_progress_exercise_uq').on(t.progressId, t.exerciseId),
    index('lesson_exercise_answers_progress_idx').on(t.progressId),
  ],
);

// Интервальное повторение слов (SM-2). Интерфейс повторения — простой (этап 4), поля закладываются сразу.
export const studentVocabulary = pgTable(
  'student_vocabulary',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    wordId: uuid('word_id').notNull().references(() => vocabularyWords.id, { onDelete: 'cascade' }),
    repetition: integer('repetition').notNull().default(0),
    // Ease factor ×100 (SM-2 обычно 1.3–2.5+) — целое число, чтобы не заводить numeric-тип в схеме.
    easeFactor: integer('ease_factor').notNull().default(250),
    intervalDays: integer('interval_days').notNull().default(0),
    dueAt: ts('due_at').notNull().defaultNow(),
    lastReviewedAt: ts('last_reviewed_at'),
    addedAt: ts('added_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('student_vocabulary_user_word_uq').on(t.userId, t.wordId),
    index('student_vocabulary_due_idx').on(t.userId, t.dueAt),
  ],
);

export const lessonProgressRelations = relations(lessonProgress, ({ one, many }) => ({
  user: one(users, { fields: [lessonProgress.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
  answers: many(lessonExerciseAnswers),
}));

export const lessonExerciseAnswersRelations = relations(lessonExerciseAnswers, ({ one }) => ({
  progress: one(lessonProgress, { fields: [lessonExerciseAnswers.progressId], references: [lessonProgress.id] }),
  exercise: one(exercises, { fields: [lessonExerciseAnswers.exerciseId], references: [exercises.id] }),
}));

export const studentVocabularyRelations = relations(studentVocabulary, ({ one }) => ({
  user: one(users, { fields: [studentVocabulary.userId], references: [users.id] }),
  word: one(vocabularyWords, { fields: [studentVocabulary.wordId], references: [vocabularyWords.id] }),
}));

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type LessonExerciseAnswer = typeof lessonExerciseAnswers.$inferSelect;
export type StudentVocabulary = typeof studentVocabulary.$inferSelect;
