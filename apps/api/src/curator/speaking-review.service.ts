import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, isNotNull, sql } from 'drizzle-orm';
import { AccessService } from '../common/access.service';
import { AuditService } from '../common/audit.service';
import { AuthUser } from '../common/auth.decorators';
import { rubricToScore } from '../common/levels';
import { SpeakingStorageService } from '../common/speaking-storage.service';
import { DB, Database } from '../db/db.module';
import {
  curatorStudents, exercises, homework, lessonExerciseAnswers, lessonProgress, lessons, placementAnswers,
  placementAttempts, questionBank, users,
} from '../db/schema';
import { SkillRecalcService } from '../learning/skill-recalc.service';
import { NotificationEventsService } from '../notifications/notification-events.service';
import { ReviewSpeakingDto } from './dto/curator.dto';

const LESSON_SPEAKING_WEIGHT = 0.1; // как мини-тест урока
type SpeakingResultsSlot =
  | { status: 'PENDING' }
  | { status: 'REVIEWED'; score: number; rubric: unknown; comment?: string | null; reviewedByCuratorId: string; reviewedAt: string };

@Injectable()
export class SpeakingReviewService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
    private readonly audit: AuditService,
    private readonly speakingStorage: SpeakingStorageService,
    private readonly skillRecalc: SkillRecalcService,
    private readonly events: NotificationEventsService,
  ) {}

  private async myStudentIds(curatorId: string): Promise<string[]> {
    const rows = await this.db.query.curatorStudents.findMany({
      where: and(eq(curatorStudents.curatorId, curatorId), eq(curatorStudents.active, true)),
      columns: { studentId: true },
    });
    return rows.map((r) => r.studentId);
  }

  /** Единая очередь на проверку: тест-плейсмент, speaking-упражнения уроков, домашние задания. */
  async reviewQueue(curatorId: string) {
    const studentIds = await this.myStudentIds(curatorId);
    if (!studentIds.length) return [];

    const studentRows = await this.db.query.users.findMany({
      where: inArray(users.id, studentIds),
      columns: { id: true, firstName: true, lastName: true },
    });
    const studentName = new Map(studentRows.map((s) => [s.id, [s.firstName, s.lastName].filter(Boolean).join(' ')]));

    const pendingPlacement = await this.db.query.placementAttempts.findMany({
      where: and(
        inArray(placementAttempts.userId, studentIds),
        eq(placementAttempts.status, 'COMPLETED'),
        sql`${placementAttempts.results} -> 'SPEAKING' ->> 'status' = 'PENDING'`,
      ),
      columns: { id: true, userId: true, completedAt: true },
    });

    const pendingLessonAnswers = await this.db
      .select({
        id: lessonExerciseAnswers.id,
        userId: lessonProgress.userId,
        answeredAt: lessonExerciseAnswers.answeredAt,
        lessonTitle: lessons.title,
      })
      .from(lessonExerciseAnswers)
      .innerJoin(lessonProgress, eq(lessonExerciseAnswers.progressId, lessonProgress.id))
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .innerJoin(exercises, eq(lessonExerciseAnswers.exerciseId, exercises.id))
      .where(
        and(
          inArray(lessonProgress.userId, studentIds),
          eq(exercises.type, 'SPEAKING'),
          isNotNull(lessonExerciseAnswers.audioKey),
          isNull(lessonExerciseAnswers.reviewedAt),
        ),
      );

    const pendingHomework = await this.db.query.homework.findMany({
      where: and(inArray(homework.studentId, studentIds), eq(homework.status, 'SUBMITTED')),
      columns: { id: true, studentId: true, title: true, submittedAt: true },
    });

    const items = [
      ...pendingPlacement.map((a) => ({
        type: 'PLACEMENT' as const,
        id: a.id,
        studentId: a.userId as string,
        studentName: studentName.get(a.userId as string) ?? '',
        title: 'Вступительный тест — Speaking',
        at: a.completedAt,
      })),
      ...pendingLessonAnswers.map((a) => ({
        type: 'LESSON' as const,
        id: a.id,
        studentId: a.userId,
        studentName: studentName.get(a.userId) ?? '',
        title: `Урок «${a.lessonTitle}» — Speaking`,
        at: a.answeredAt,
      })),
      ...pendingHomework.map((h) => ({
        type: 'HOMEWORK' as const,
        id: h.id,
        studentId: h.studentId,
        studentName: studentName.get(h.studentId) ?? '',
        title: h.title,
        at: h.submittedAt,
      })),
    ];

    return items.sort((a, b) => new Date(a.at ?? 0).getTime() - new Date(b.at ?? 0).getTime());
  }

  // ── Плейсмент-тест ───────────────────────────────────────

  async getPlacementRecordings(actor: AuthUser, attemptId: string) {
    const attempt = await this.db.query.placementAttempts.findFirst({ where: eq(placementAttempts.id, attemptId) });
    if (!attempt || !attempt.userId) throw new NotFoundException('Attempt not found');
    await this.access.assertCanViewStudent(actor, attempt.userId);

    const answers = await this.db.query.placementAnswers.findMany({
      where: and(eq(placementAnswers.attemptId, attemptId), eq(placementAnswers.skill, 'SPEAKING')),
      orderBy: asc(placementAnswers.answeredAt),
    });

    const results = [];
    for (const a of answers) {
      if (!a.audioKey) continue;
      const question = await this.db.query.questionBank.findFirst({ where: eq(questionBank.id, a.questionId) });
      await this.audit.log({
        actorId: actor.id,
        action: 'speaking.listen',
        entity: 'placement_answer',
        entityId: a.id,
        meta: { studentId: attempt.userId },
      });
      const url = await this.speakingStorage.getListenUrl(a.audioKey);
      results.push({ answerId: a.id, prompt: (question?.content as Record<string, unknown> | undefined)?.prompt ?? null, url });
    }
    return results;
  }

  async reviewPlacementSpeaking(actor: AuthUser, attemptId: string, dto: ReviewSpeakingDto) {
    const attempt = await this.db.query.placementAttempts.findFirst({ where: eq(placementAttempts.id, attemptId) });
    if (!attempt || !attempt.userId) throw new NotFoundException('Attempt not found');
    await this.access.assertCanViewStudent(actor, attempt.userId);

    const results = (attempt.results as Record<string, unknown>) ?? {};
    const speaking = results.SPEAKING as SpeakingResultsSlot | undefined;
    if (!speaking || speaking.status !== 'PENDING') throw new BadRequestException('Speaking is not awaiting review for this attempt');

    const score = rubricToScore(dto.rubric);
    await this.skillRecalc.recalcSkill(attempt.userId, 'SPEAKING', score, 1, 'PLACEMENT'); // вес 1 = прямая установка, как остальные навыки теста

    const updatedResults = {
      ...results,
      SPEAKING: {
        status: 'REVIEWED',
        score,
        rubric: dto.rubric,
        comment: dto.comment ?? null,
        reviewedByCuratorId: actor.id,
        reviewedAt: new Date().toISOString(),
      },
    };
    await this.db.update(placementAttempts).set({ results: updatedResults }).where(eq(placementAttempts.id, attemptId));
    await this.notifyReviewed(attempt.userId, 'Вступительный тест — Speaking');
    return updatedResults.SPEAKING;
  }

  private async notifyReviewed(studentId: string, title: string) {
    const parentIds = await this.access.getActiveParentIds(studentId);
    await this.events.emit('REVIEW_CREATED', [studentId, ...parentIds], {
      title: 'Куратор оценил запись речи',
      body: `«${title}» — проверено, посмотрите результат.`,
      meta: { studentId },
    });
  }

  // ── Speaking-упражнения в уроках ─────────────────────────

  async getLessonRecording(actor: AuthUser, answerId: string) {
    const row = await this.db.query.lessonExerciseAnswers.findFirst({
      where: eq(lessonExerciseAnswers.id, answerId),
      with: { progress: { columns: { userId: true } } },
    });
    if (!row || !row.audioKey) throw new NotFoundException('Recording not found');
    await this.access.assertCanViewStudent(actor, row.progress.userId);

    await this.audit.log({
      actorId: actor.id,
      action: 'speaking.listen',
      entity: 'lesson_exercise_answer',
      entityId: row.id,
      meta: { studentId: row.progress.userId },
    });
    const url = await this.speakingStorage.getListenUrl(row.audioKey);
    return { url };
  }

  async reviewLessonSpeaking(actor: AuthUser, answerId: string, dto: ReviewSpeakingDto) {
    const row = await this.db.query.lessonExerciseAnswers.findFirst({
      where: eq(lessonExerciseAnswers.id, answerId),
      with: { progress: { columns: { userId: true } } },
    });
    if (!row || !row.audioKey) throw new NotFoundException('Recording not found');
    if (row.reviewedAt) throw new BadRequestException('Already reviewed');
    await this.access.assertCanViewStudent(actor, row.progress.userId);

    const score = rubricToScore(dto.rubric);
    await this.skillRecalc.recalcSkill(row.progress.userId, 'SPEAKING', score, LESSON_SPEAKING_WEIGHT, 'LESSON_MINI_TEST');

    const [updated] = await this.db
      .update(lessonExerciseAnswers)
      .set({ rubric: dto.rubric, reviewComment: dto.comment ?? null, reviewedAt: new Date(), reviewedByCuratorId: actor.id })
      .where(eq(lessonExerciseAnswers.id, answerId))
      .returning();
    await this.notifyReviewed(row.progress.userId, 'Speaking-упражнение урока');
    return updated;
  }
}
