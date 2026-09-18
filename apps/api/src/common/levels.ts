/** Уровень курса/слова/цели ученика — 5 ступеней. */
export const COURSE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

/** Уровень вопроса в банке — 9 ступеней для полуадаптивной лестницы placement-теста. */
export const QUESTION_LEVELS = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1'] as const;
export type QuestionLevel = (typeof QUESTION_LEVELS)[number];

/** Границы баллов для каждой ступени — из таблицы уровней в CLAUDE.md. Индекс = позиция в QUESTION_LEVELS. */
export const LEVEL_SCORE_BANDS: readonly [number, number][] = [
  [0, 14], [15, 24], [25, 34], [35, 44], [45, 54], [55, 64], [65, 74], [75, 84], [85, 100],
];

/** Балл по умолчанию для уровня — середина его диапазона. */
export function levelMidpointScore(level: QuestionLevel): number {
  const [lo, hi] = LEVEL_SCORE_BANDS[QUESTION_LEVELS.indexOf(level)];
  return Math.round((lo + hi) / 2);
}

/** CEFR-уровень по баллу 0–100. */
export function scoreToLevel(score: number): QuestionLevel {
  const clamped = Math.max(0, Math.min(100, score));
  const idx = LEVEL_SCORE_BANDS.findIndex(([lo, hi]) => clamped >= lo && clamped <= hi);
  return QUESTION_LEVELS[idx === -1 ? LEVEL_SCORE_BANDS.length - 1 : idx];
}

/** Средний уровень CEFR (5 ступеней) для отображения ученику/куратору — сжимает A1+/A2+/... до соседней базовой ступени. */
export function toCourseLevel(level: QuestionLevel): CourseLevel {
  return level.replace('+', '') as CourseLevel;
}

export const SKILLS = ['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'SPEAKING'] as const;
export type SkillName = (typeof SKILLS)[number];

export interface EnglishProfile {
  overall: number | null;
  overallLevel: QuestionLevel | null;
  strongest: SkillName | null;
  weakest: SkillName | null;
  skills: Record<SkillName, { score: number; level: QuestionLevel } | null>;
}

/** Собирает English Profile из текущих баллов профиля ученика (см. правило «Overall = среднее пяти навыков»). */
export function buildEnglishProfile(scores: Record<SkillName, number | null>): EnglishProfile {
  const skills = {} as EnglishProfile['skills'];
  for (const skill of SKILLS) {
    const score = scores[skill];
    skills[skill] = score == null ? null : { score, level: scoreToLevel(score) };
  }
  const measured = SKILLS.filter((s) => skills[s] !== null);
  if (!measured.length) return { overall: null, overallLevel: null, strongest: null, weakest: null, skills };

  const overall = Math.round(measured.reduce((sum, s) => sum + skills[s]!.score, 0) / measured.length);
  const strongest = measured.reduce((a, b) => (skills[a]!.score >= skills[b]!.score ? a : b));
  const weakest = measured.reduce((a, b) => (skills[a]!.score <= skills[b]!.score ? a : b));
  return { overall, overallLevel: scoreToLevel(overall), strongest, weakest, skills };
}

/** Целевой балл для уровня цели ученика — ориентир при расчёте плана на день. */
export const TARGET_SCORE_BY_LEVEL: Record<CourseLevel, number> = {
  A1: 20, A2: 40, B1: 60, B2: 80, C1: 95,
};

/** Пересчёт навыка по правилу из CLAUDE.md: new = old × (1 − w) + result × w. */
export function recalcSkillScore(oldScore: number | null, result: number, weight: number): number {
  const base = oldScore ?? result;
  return Math.round(Math.max(0, Math.min(100, base * (1 - weight) + result * weight)));
}

/**
 * Навыки, отсортированные по отставанию от цели (для плана на день берутся первые три).
 * Неизмеренный навык считается максимально приоритетным.
 */
export function priorityLearningPath(
  scores: Record<SkillName, number | null>,
  targetLevel: CourseLevel | null,
): SkillName[] {
  const targetScore = TARGET_SCORE_BY_LEVEL[targetLevel ?? 'B1'];
  return [...SKILLS]
    .map((skill) => {
      const score = scores[skill];
      const gap = score == null ? targetScore + 100 : targetScore - score;
      return { skill, gap };
    })
    .sort((a, b) => b.gap - a.gap)
    .map((g) => g.skill);
}
