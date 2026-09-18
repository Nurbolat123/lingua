import { eq } from 'drizzle-orm';
import { recalcSkillScore } from '../common/levels';
import { Database } from '../db/db.module';
import { Skill, skillSnapshots, studentProfiles } from '../db/schema';

const SKILL_COLUMN = {
  GRAMMAR: 'grammarScore',
  VOCABULARY: 'vocabularyScore',
  READING: 'readingScore',
  LISTENING: 'listeningScore',
  SPEAKING: 'speakingScore',
} as const satisfies Record<Skill, keyof typeof studentProfiles.$inferInsert>;

const MINI_TEST_WEIGHT = 0.1; // вес мини-теста урока — см. CLAUDE.md
const CORRECT_RESULT = 80;
const INCORRECT_RESULT = 25;

/**
 * Пересчёт навыка после мини-теста урока или практического задания дня (тот же вес,
 * что и мини-тест). Пишет снимок в историю — см. правило «Историю хранить отдельными записями».
 */
export async function recalcSkillAfterMiniTest(db: Database, userId: string, skill: Skill, isCorrect: boolean) {
  const profile = await db.query.studentProfiles.findFirst({ where: eq(studentProfiles.userId, userId) });
  if (!profile) return;

  const column = SKILL_COLUMN[skill];
  const oldScore = profile[column] as number | null;
  const result = isCorrect ? CORRECT_RESULT : INCORRECT_RESULT;
  const newScore = recalcSkillScore(oldScore, result, MINI_TEST_WEIGHT);

  await db.update(studentProfiles).set({ [column]: newScore }).where(eq(studentProfiles.userId, userId));
  await db.insert(skillSnapshots).values({ userId, skill, score: newScore, source: 'LESSON_MINI_TEST' });
}
