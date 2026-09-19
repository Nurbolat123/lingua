import type { QuestionLevel } from "./types";

const QUESTION_LEVELS: QuestionLevel[] = ["A1", "A1+", "A2", "A2+", "B1", "B1+", "B2", "B2+", "C1"];

/** Совпадает с таблицей уровней в apps/api/src/common/levels.ts — только для отображения. */
const LEVEL_SCORE_BANDS: [number, number][] = [
  [0, 14],
  [15, 24],
  [25, 34],
  [35, 44],
  [45, 54],
  [55, 64],
  [65, 74],
  [75, 84],
  [85, 100],
];

export function scoreToLevel(score: number): QuestionLevel {
  const clamped = Math.max(0, Math.min(100, score));
  const idx = LEVEL_SCORE_BANDS.findIndex(([lo, hi]) => clamped >= lo && clamped <= hi);
  return QUESTION_LEVELS[idx === -1 ? LEVEL_SCORE_BANDS.length - 1 : idx];
}
