export type CefrTarget = "A1" | "A2" | "B1" | "B2" | "C1";

export type Role = "STUDENT" | "PARENT" | "CURATOR" | "ADMIN";
export type UserStatus = "ACTIVE" | "PENDING_CONSENT" | "BLOCKED";

export interface PublicUser {
  id: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  firstName: string;
  lastName: string | null;
  locale: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface StudentProfile {
  birthDate: string;
  isMinor: boolean;
  targetLevel: CefrTarget | null;
  goal: string | null;
  dailyMinutes: number;
  grammarScore: number | null;
  vocabularyScore: number | null;
  readingScore: number | null;
  listeningScore: number | null;
  speakingScore: number | null;
}

export interface EnglishProfileSkill {
  score: number;
  level: QuestionLevel;
}

export interface EnglishProfile {
  overall: number | null;
  overallLevel: QuestionLevel | null;
  strongest: Skill | null;
  weakest: Skill | null;
  skills: Record<Skill, EnglishProfileSkill | null>;
}

export type SkillSnapshotSource = "PLACEMENT" | "CONTROL_TEST" | "LESSON_MINI_TEST";

export interface SkillSnapshot {
  skill: Skill;
  score: number;
  source: SkillSnapshotSource;
  createdAt: string;
}

export interface MeResponse extends PublicUser {
  studentProfile: StudentProfile | null;
  englishProfile: EnglishProfile | null;
  activeConsents: { type: string; version: string; grantedAt: string }[];
  requiresParentConsent: boolean;
}

export interface LinkCode {
  code: string;
  expiresAt: string;
}

export type ConsentType = "DATA_PROCESSING" | "VOICE_RECORDING" | "CAMERA" | "MICROPHONE" | "MARKETING";

export interface ActiveConsent {
  type: ConsentType;
  version: string;
  grantedAt: string;
}

export interface ChildSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  status: "ACTIVE" | "PENDING_CONSENT" | "BLOCKED";
  lastLoginAt: string | null;
  linkedAt: string;
  studentProfile: {
    isMinor: boolean;
    birthDate: string;
    targetLevel: CefrTarget | null;
    dailyMinutes: number;
  };
  consents: ActiveConsent[];
}

export interface CuratorStudent {
  id: string;
  firstName: string;
  lastName: string | null;
  status: "ACTIVE" | "PENDING_CONSENT" | "BLOCKED";
  lastLoginAt: string | null;
  assignedAt: string;
  studentProfile: {
    isMinor: boolean;
    targetLevel: CefrTarget | null;
    dailyMinutes: number;
  };
}

export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  status: "ACTIVE" | "PENDING_CONSENT" | "BLOCKED";
  locale: string;
  lastLoginAt: string | null;
  createdAt: string;
  studentProfile: {
    isMinor: boolean;
    targetLevel: CefrTarget | null;
    goal: string | null;
    dailyMinutes: number;
  };
  curator: { id: string; firstName: string; lastName: string | null; assignedAt: string } | null;
}

export interface UserListResponse {
  items: PublicUser[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Контент (Шаг 2) ─────────────────────────────────────
export type QuestionLevel = "A1" | "A1+" | "A2" | "A2+" | "B1" | "B1+" | "B2" | "B2+" | "C1";
export type Audience = "KIDS" | "TEENS" | "ADULTS";
export type Skill = "GRAMMAR" | "VOCABULARY" | "READING" | "LISTENING" | "SPEAKING";
export type LessonBlockType =
  | "INTRO" | "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING"
  | "EXERCISE" | "SPEAKING" | "MINI_TEST" | "HOMEWORK";
export type ExerciseType = "MULTIPLE_CHOICE" | "FILL_BLANK" | "MATCHING" | "ORDERING" | "FREE_RESPONSE" | "SPEAKING";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: CefrTarget;
  audience: Audience;
  isDemo: boolean;
  createdAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  order: number;
  estimatedMinutes: number;
}

export interface CourseWithModules extends Course {
  modules: (CourseModule & { lessons: Lesson[] })[];
}

export interface Exercise {
  id: string;
  lessonBlockId: string;
  type: ExerciseType;
  order: number;
  content: Record<string, unknown>;
}

export interface LessonBlock {
  id: string;
  lessonId: string;
  type: LessonBlockType;
  order: number;
  title: string | null;
  content: Record<string, unknown>;
}

export interface LessonWithBlocks extends Lesson {
  blocks: (LessonBlock & { exercises: Exercise[] })[];
}

export interface VocabularyWord {
  id: string;
  word: string;
  translationRu: string;
  translationKk: string | null;
  definition: string | null;
  level: CefrTarget;
  transcription: string | null;
  audioUrl: string | null;
  examples: string[];
  collocations: string[];
  relatedWords: string[];
  isDemo: boolean;
}

export interface VocabularyListResponse {
  items: VocabularyWord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImportResult {
  imported: number;
  skipped: { row: number; reason: string }[];
}

export interface QuestionBankItem {
  id: string;
  skill: Skill;
  level: QuestionLevel;
  difficulty: number;
  type: ExerciseType;
  content: Record<string, unknown>;
  isDemo: boolean;
}

export interface QuestionListResponse {
  items: QuestionBankItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Placement-тест (Шаг 3) ─────────────────────────────────────
export type PlacementStatus = "IN_PROGRESS" | "COMPLETED";

export interface PlacementSkillResult {
  level: QuestionLevel;
  score: number;
}

export type PlacementResults = Partial<Record<Skill, PlacementSkillResult | { status: "PENDING" }>> & {
  overall?: number;
  strongest?: Skill;
  weakest?: Skill;
};

export interface PlacementAttemptState {
  id: string;
  status: PlacementStatus;
  includeSpeaking: boolean;
  currentSkill: Skill | null;
  results: PlacementResults | null;
}

export interface PlacementProgress {
  skill: Skill;
  answered: number;
  total: number;
  skillIndex: number;
  totalSkills: number;
}

export interface PlacementQuestion {
  id: string;
  type: ExerciseType;
  content: Record<string, unknown>;
}

export interface PlacementNextQuestion {
  completed: boolean;
  question?: PlacementQuestion;
  skill?: Skill;
  level?: QuestionLevel;
  progress?: PlacementProgress;
}

export interface PlacementAnswerResult {
  skillCompleted: boolean;
  attemptCompleted: boolean;
  nextSkill?: Skill;
  progress?: PlacementProgress;
  results?: PlacementResults;
}

export interface PlacementPresign {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

/** Общая форма вопроса/упражнения с проверкой на сервере — placement, банк вопросов, урок. */
export type ExerciseItem = PlacementQuestion;

// ── Обучение (Шаг 4) ─────────────────────────────────────────
export type LessonProgressStatus = "IN_PROGRESS" | "COMPLETED";

export interface TodayPlanLesson {
  id: string;
  title: string;
  estimatedMinutes: number;
  status: "NOT_STARTED" | LessonProgressStatus;
  currentBlockOrder: number;
}

export interface DueVocabularyWord {
  id: string;
  word: string;
  translationRu: string;
  transcription?: string | null;
  example?: string | null;
}

export interface PracticeQuestion extends ExerciseItem {
  skill: Skill;
  level: QuestionLevel;
}

export interface TodayPlan {
  prioritySkills: Skill[];
  dailyMinutes: number;
  lesson: TodayPlanLesson | null;
  vocabularyReview: { total: number; words: { id: string; word: string; translationRu: string }[] };
  practiceQuestion: PracticeQuestion | null;
}

export interface SubmitAnswerResult {
  isCorrect: boolean | null;
  explanation: string | null;
}

export interface LessonExerciseAnswerState {
  answer: unknown;
  isCorrect: boolean | null;
  hasAudio: boolean;
}

export interface LessonExerciseData extends ExerciseItem {
  order: number;
  answer: LessonExerciseAnswerState | null;
}

export interface LessonBlockData {
  id: string;
  type: LessonBlockType;
  order: number;
  title: string | null;
  content: Record<string, unknown>;
  exercises: LessonExerciseData[];
}

export interface LessonPlayerData {
  id: string;
  title: string;
  description: string | null;
  estimatedMinutes: number;
  progress: { status: LessonProgressStatus; currentBlockOrder: number; activeSeconds: number };
  blocks: LessonBlockData[];
}

export interface CompleteBlockResult {
  status: LessonProgressStatus;
  currentBlockOrder: number;
}
