import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AccessService } from '../common/access.service';
import { recalcSkillScore } from '../common/levels';
import { DB, Database } from '../db/db.module';
import { Skill, SkillSnapshotSource, skillSnapshots, studentProfiles, users } from '../db/schema';
import { NotificationEventsService } from '../notifications/notification-events.service';

const SKILL_COLUMN = {
  GRAMMAR: 'grammarScore',
  VOCABULARY: 'vocabularyScore',
  READING: 'readingScore',
  LISTENING: 'listeningScore',
  SPEAKING: 'speakingScore',
} as const satisfies Record<Skill, keyof typeof studentProfiles.$inferInsert>;

const SKILL_LABEL: Record<Skill, string> = {
  GRAMMAR: 'Грамматика', VOCABULARY: 'Лексика', READING: 'Чтение', LISTENING: 'Аудирование', SPEAKING: 'Говорение',
};

export const MINI_TEST_WEIGHT = 0.1; // вес мини-теста урока и ДЗ — см. CLAUDE.md
const CORRECT_RESULT = 80;
const INCORRECT_RESULT = 25;
const SCORE_DROP_THRESHOLD = 5; // не уведомлять о шуме в пару баллов

@Injectable()
export class SkillRecalcService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly events: NotificationEventsService,
    private readonly access: AccessService,
  ) {}

  /**
   * Пересчёт навыка с произвольным весом/источником (мини-тест, проверка ДЗ куратором, оценка speaking).
   * Пишет снимок в историю — см. правило «Историю хранить отдельными записями».
   */
  async recalcSkill(userId: string, skill: Skill, result: number, weight: number, source: SkillSnapshotSource) {
    const profile = await this.db.query.studentProfiles.findFirst({ where: eq(studentProfiles.userId, userId) });
    if (!profile) return null;

    const column = SKILL_COLUMN[skill];
    const oldScore = profile[column] as number | null;
    const newScore = recalcSkillScore(oldScore, result, weight);

    await this.db.transaction(async (tx) => {
      await tx.update(studentProfiles).set({ [column]: newScore }).where(eq(studentProfiles.userId, userId));
      await tx.insert(skillSnapshots).values({ userId, skill, score: newScore, source });
    });

    if (oldScore != null && newScore <= oldScore - SCORE_DROP_THRESHOLD) {
      await this.notifyScoreDropped(userId, skill, oldScore, newScore);
    }
    return newScore;
  }

  /** Пересчёт навыка после мини-теста урока или практического задания дня (тот же вес, что и мини-тест). */
  async recalcSkillAfterMiniTest(userId: string, skill: Skill, isCorrect: boolean) {
    const result = isCorrect ? CORRECT_RESULT : INCORRECT_RESULT;
    return this.recalcSkill(userId, skill, result, MINI_TEST_WEIGHT, 'LESSON_MINI_TEST');
  }

  private async notifyScoreDropped(userId: string, skill: Skill, oldScore: number, newScore: number) {
    const parentIds = await this.access.getActiveParentIds(userId);
    if (!parentIds.length) return;
    const student = await this.db.query.users.findFirst({ where: eq(users.id, userId), columns: { firstName: true } });

    await this.events.emit('SCORE_DROPPED', parentIds, {
      title: 'Балл по навыку снизился',
      body: `${student?.firstName ?? 'Ученик'}: ${SKILL_LABEL[skill]} — было ${oldScore}, стало ${newScore}.`,
      meta: { studentId: userId, skill },
    });
  }
}
