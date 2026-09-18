import { eq } from 'drizzle-orm';
import { recalcSkillScore } from '../common/levels';
import { Database } from '../db/db.module';
import { Skill, SkillSnapshotSource, skillSnapshots, studentProfiles } from '../db/schema';

const SKILL_COLUMN = {
  GRAMMAR: 'grammarScore',
  VOCABULARY: 'vocabularyScore',
  READING: 'readingScore',
  LISTENING: 'listeningScore',
  SPEAKING: 'speakingScore',
} as const satisfies Record<Skill, keyof typeof studentProfiles.$inferInsert>;

const MINI_TEST_WEIGHT = 0.1; // вес мини-теста урока и ДЗ — см. CLAUDE.md
const CORRECT_RESULT = 80;
const INCORRECT_RESULT = 25;

/**
 * Пересчёт навыка с произвольным весом/источником (мини-тест, проверка ДЗ куратором, оценка speaking).
 * Пишет снимок в историю — см. правило «Историю хранить отдельными записями».
 */
export async function recalcSkill(
  db: Database,
  userId: string,
  skill: Skill,
  result: number,
  weight: number,
  source: SkillSnapshotSource,
) {
  const profile = await db.query.studentProfiles.findFirst({ where: eq(studentProfiles.userId, userId) });
  if (!profile) return null;

  const column = SKILL_COLUMN[skill];
  const oldScore = profile[column] as number | null;
  const newScore = recalcSkillScore(oldScore, result, weight);

  await db.update(studentProfiles).set({ [column]: newScore }).where(eq(studentProfiles.userId, userId));
  await db.insert(skillSnapshots).values({ userId, skill, score: newScore, source });
  return newScore;
}

/**
 * Пересчёт навыка после мини-теста урока или практического задания дня (тот же вес,
 * что и мини-тест).
 */
export async function recalcSkillAfterMiniTest(db: Database, userId: string, skill: Skill, isCorrect: boolean) {
  const result = isCorrect ? CORRECT_RESULT : INCORRECT_RESULT;
  return recalcSkill(db, userId, skill, result, MINI_TEST_WEIGHT, 'LESSON_MINI_TEST');
}

export { MINI_TEST_WEIGHT };
