import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { gradeAnswer, stripAnswer } from '../common/exerciseContent';
import { DB, Database } from '../db/db.module';
import {
  consents, exercises, lessonBlocks, lessonExerciseAnswers, LessonExerciseAnswer, lessonProgress, lessons,
  studentVocabulary, vocabularyWords,
} from '../db/schema';
import { SubmitLessonAnswerDto, SubmitLessonSpeakingDto } from './dto/learning.dto';
import { recalcSkillAfterMiniTest } from './skill-recalc';

@Injectable()
export class LessonPlayerService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async getLesson(userId: string, lessonId: string) {
    const lesson = await this.db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      with: { blocks: { orderBy: asc(lessonBlocks.order), with: { exercises: { orderBy: asc(exercises.order) } } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const progress = await this.getOrCreateProgress(userId, lessonId);
    const answers = await this.db.query.lessonExerciseAnswers.findMany({
      where: eq(lessonExerciseAnswers.progressId, progress.id),
    });
    const answerByExercise = new Map<string, LessonExerciseAnswer>(answers.map((a) => [a.exerciseId, a]));

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      progress: {
        status: progress.status,
        currentBlockOrder: progress.currentBlockOrder,
        activeSeconds: progress.activeSeconds,
      },
      blocks: lesson.blocks.map((block) => ({
        id: block.id,
        type: block.type,
        order: block.order,
        title: block.title,
        content: block.content,
        exercises: block.exercises.map((ex) => {
          const a = answerByExercise.get(ex.id);
          return {
            id: ex.id,
            type: ex.type,
            order: ex.order,
            content: stripAnswer(ex.type, ex.content as Record<string, unknown>),
            answer: a ? { answer: a.answer, isCorrect: a.isCorrect, hasAudio: !!a.audioKey } : null,
          };
        }),
      })),
    };
  }

  async submitAnswer(userId: string, lessonId: string, exerciseId: string, dto: SubmitLessonAnswerDto) {
    const exercise = await this.loadExerciseInLesson(lessonId, exerciseId);
    if (exercise.type === 'SPEAKING') throw new BadRequestException('Use the speaking endpoint for this exercise');

    const progress = await this.getOrCreateProgress(userId, lessonId);
    const isCorrect = gradeAnswer(exercise.type, exercise.content as Record<string, unknown>, dto.answer);

    await this.upsertAnswer(progress.id, exerciseId, { answer: dto.answer as object, isCorrect });

    if (exercise.skill && isCorrect !== null) {
      await recalcSkillAfterMiniTest(this.db, userId, exercise.skill, isCorrect);
    }

    const content = exercise.content as Record<string, unknown>;
    return { isCorrect, explanation: (content.explanation as string | undefined) ?? null };
  }

  async submitSpeaking(userId: string, lessonId: string, exerciseId: string, dto: SubmitLessonSpeakingDto) {
    const exercise = await this.loadExerciseInLesson(lessonId, exerciseId);
    if (exercise.type !== 'SPEAKING') throw new BadRequestException('Exercise is not a speaking task');

    const consent = await this.db.query.consents.findFirst({
      where: and(eq(consents.subjectId, userId), eq(consents.type, 'VOICE_RECORDING'), isNull(consents.revokedAt)),
    });
    if (!consent) throw new ForbiddenException({ code: 'VOICE_RECORDING_CONSENT_REQUIRED', message: 'Voice recording consent is required' });

    const progress = await this.getOrCreateProgress(userId, lessonId);
    await this.upsertAnswer(progress.id, exerciseId, { audioKey: dto.audioKey, isCorrect: null });

    return { submitted: true };
  }

  /** Ученик закончил блок (посмотрел/ответил на все его упражнения) — переходит к следующему. */
  async completeBlock(userId: string, lessonId: string, blockId: string) {
    const block = await this.db.query.lessonBlocks.findFirst({ where: eq(lessonBlocks.id, blockId) });
    if (!block || block.lessonId !== lessonId) throw new NotFoundException('Block not found');

    if (block.type === 'VOCABULARY') {
      await this.addWordsToVocabulary(userId, block.content as Record<string, unknown>);
    }

    const progress = await this.getOrCreateProgress(userId, lessonId);
    const lastBlock = await this.db.query.lessonBlocks.findFirst({
      where: eq(lessonBlocks.lessonId, lessonId),
      orderBy: desc(lessonBlocks.order),
      columns: { order: true },
    });
    const isLast = !lastBlock || block.order >= lastBlock.order;

    const [updated] = await this.db
      .update(lessonProgress)
      .set({
        currentBlockOrder: Math.max(progress.currentBlockOrder, block.order + 1),
        status: isLast ? 'COMPLETED' : progress.status,
        completedAt: isLast ? new Date() : progress.completedAt,
      })
      .where(eq(lessonProgress.id, progress.id))
      .returning();

    return { status: updated.status, currentBlockOrder: updated.currentBlockOrder };
  }

  /** Активное время (не просто открытая вкладка — клиент шлёт «пульс» только пока ученик взаимодействует). */
  async heartbeat(userId: string, lessonId: string, seconds: number) {
    const progress = await this.getOrCreateProgress(userId, lessonId);
    const [updated] = await this.db
      .update(lessonProgress)
      .set({ activeSeconds: progress.activeSeconds + seconds })
      .where(eq(lessonProgress.id, progress.id))
      .returning({ activeSeconds: lessonProgress.activeSeconds });
    return { activeSeconds: updated.activeSeconds };
  }

  private async getOrCreateProgress(userId: string, lessonId: string) {
    const existing = await this.db.query.lessonProgress.findFirst({
      where: and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)),
    });
    if (existing) return existing;
    const [row] = await this.db.insert(lessonProgress).values({ userId, lessonId }).returning();
    return row;
  }

  private async loadExerciseInLesson(lessonId: string, exerciseId: string) {
    const exercise = await this.db.query.exercises.findFirst({
      where: eq(exercises.id, exerciseId),
      with: { block: { columns: { lessonId: true } } },
    });
    if (!exercise || exercise.block.lessonId !== lessonId) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  private async upsertAnswer(
    progressId: string,
    exerciseId: string,
    values: { answer?: object; audioKey?: string; isCorrect: boolean | null },
  ) {
    await this.db
      .insert(lessonExerciseAnswers)
      .values({ progressId, exerciseId, ...values })
      .onConflictDoUpdate({
        target: [lessonExerciseAnswers.progressId, lessonExerciseAnswers.exerciseId],
        set: { ...values, answeredAt: new Date() },
      });
  }

  private async addWordsToVocabulary(userId: string, content: Record<string, unknown>) {
    const words = (content.words as string[] | undefined) ?? [];
    if (!words.length) return;
    const rows = await this.db.query.vocabularyWords.findMany({ where: inArray(vocabularyWords.word, words) });
    if (!rows.length) return;
    await this.db
      .insert(studentVocabulary)
      .values(rows.map((w) => ({ userId, wordId: w.id })))
      .onConflictDoNothing({ target: [studentVocabulary.userId, studentVocabulary.wordId] });
  }
}
