import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { AccessService } from '../common/access.service';
import { AuditService } from '../common/audit.service';
import { AuthUser } from '../common/auth.decorators';
import { rubricToScore } from '../common/levels';
import { PresignSpeakingDto } from '../common/dto/presign-speaking.dto';
import { SpeakingStorageService } from '../common/speaking-storage.service';
import { DB, Database } from '../db/db.module';
import { homework, LessonBlock } from '../db/schema';
import { SkillRecalcService } from '../learning/skill-recalc.service';
import { NotificationEventsService } from '../notifications/notification-events.service';
import { AssignHomeworkDto, ReviewHomeworkDto, SubmitHomeworkDto } from './dto/homework.dto';

const HOMEWORK_SPEAKING_WEIGHT = 0.1; // как мини-тест урока — см. CLAUDE.md и обсуждение шага 5

@Injectable()
export class HomeworkService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
    private readonly audit: AuditService,
    private readonly speakingStorage: SpeakingStorageService,
    private readonly skillRecalc: SkillRecalcService,
    private readonly events: NotificationEventsService,
  ) {}

  /** Автоматическое ДЗ из блока урока HOMEWORK — вызывается при завершении блока (идемпотентно). */
  async autoAssignFromBlock(studentId: string, lessonId: string, block: LessonBlock) {
    const existing = await this.db.query.homework.findFirst({
      where: and(eq(homework.studentId, studentId), eq(homework.lessonBlockId, block.id)),
    });
    if (existing) return existing;

    const content = block.content as Record<string, unknown> | null;
    const [row] = await this.db
      .insert(homework)
      .values({
        studentId,
        lessonId,
        lessonBlockId: block.id,
        title: block.title ?? 'Домашнее задание',
        instructions: (content?.text as string | undefined) ?? null,
      })
      .returning();
    await this.notifyAssigned(row.studentId, row.title);
    return row;
  }

  async assign(actor: AuthUser, dto: AssignHomeworkDto) {
    await this.access.assertCanViewStudent(actor, dto.studentId);
    const [row] = await this.db
      .insert(homework)
      .values({
        studentId: dto.studentId,
        assignedByCuratorId: actor.id,
        title: dto.title,
        instructions: dto.instructions,
        requiresIntegrityCheck: dto.requiresIntegrityCheck ?? false,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      })
      .returning();
    await this.notifyAssigned(row.studentId, row.title);
    return row;
  }

  private async notifyAssigned(studentId: string, title: string) {
    await this.events.emit('ASSIGNMENT_CREATED', [studentId], {
      title: 'Новое домашнее задание',
      body: `«${title}» — загляните в кабинет, чтобы выполнить.`,
      meta: { studentId },
    });
  }

  async listMine(studentId: string) {
    return this.db.query.homework.findMany({
      where: eq(homework.studentId, studentId),
      orderBy: [desc(homework.createdAt)],
    });
  }

  async listForStudent(actor: AuthUser, studentId: string) {
    await this.access.assertCanViewStudent(actor, studentId);
    return this.listMine(studentId);
  }

  async presignAudio(studentId: string, homeworkId: string, dto: PresignSpeakingDto) {
    const row = await this.loadOwnHomework(studentId, homeworkId);
    if (!['ASSIGNED', 'RETURNED'].includes(row.status)) {
      throw new BadRequestException('Homework is not open for submission');
    }
    return this.speakingStorage.presign(dto, studentId);
  }

  async submit(studentId: string, homeworkId: string, dto: SubmitHomeworkDto) {
    const row = await this.loadOwnHomework(studentId, homeworkId);
    if (!['ASSIGNED', 'RETURNED'].includes(row.status)) {
      throw new BadRequestException('Homework is not open for submission');
    }

    const [updated] = await this.db
      .update(homework)
      .set({
        status: 'SUBMITTED',
        submissionText: dto.text ?? null,
        submissionAudioKey: dto.audioKey ?? null,
        submittedAt: new Date(),
        integritySignals: dto.integritySignals ?? null,
      })
      .where(eq(homework.id, homeworkId))
      .returning();
    return updated;
  }

  async getListenUrl(actor: AuthUser, homeworkId: string) {
    const row = await this.db.query.homework.findFirst({ where: eq(homework.id, homeworkId) });
    if (!row) throw new NotFoundException('Homework not found');
    await this.access.assertCanViewStudent(actor, row.studentId);
    if (!row.submissionAudioKey) throw new BadRequestException('No audio submission for this homework');

    await this.audit.log({
      actorId: actor.id,
      action: 'speaking.listen',
      entity: 'homework',
      entityId: row.id,
      meta: { studentId: row.studentId },
    });
    const url = await this.speakingStorage.getListenUrl(row.submissionAudioKey);
    return { url };
  }

  async review(actor: AuthUser, homeworkId: string, dto: ReviewHomeworkDto) {
    const row = await this.db.query.homework.findFirst({ where: eq(homework.id, homeworkId) });
    if (!row) throw new NotFoundException('Homework not found');
    await this.access.assertCanViewStudent(actor, row.studentId);
    if (row.status !== 'SUBMITTED') throw new BadRequestException('Homework is not awaiting review');

    if (dto.action === 'RETURN') {
      if (!dto.comment) throw new BadRequestException('A comment is required when returning homework for revision');
      const [updated] = await this.db
        .update(homework)
        .set({ status: 'RETURNED', reviewComment: dto.comment, reviewedAt: new Date(), reviewedByCuratorId: actor.id })
        .where(eq(homework.id, homeworkId))
        .returning();
      await this.notifyReviewed(row.studentId, row.title, 'возвращено на доработку');
      return updated;
    }

    if (dto.rubric && !row.submissionAudioKey) {
      throw new BadRequestException('Rubric requires an audio submission');
    }
    if (dto.rubric) {
      const score = rubricToScore(dto.rubric);
      await this.skillRecalc.recalcSkill(row.studentId, 'SPEAKING', score, HOMEWORK_SPEAKING_WEIGHT, 'HOMEWORK');
    }

    const [updated] = await this.db
      .update(homework)
      .set({
        status: 'REVIEWED',
        rubric: dto.rubric ?? null,
        reviewComment: dto.comment ?? null,
        reviewedAt: new Date(),
        reviewedByCuratorId: actor.id,
      })
      .where(eq(homework.id, homeworkId))
      .returning();
    await this.notifyReviewed(row.studentId, row.title, 'проверено');
    return updated;
  }

  private async notifyReviewed(studentId: string, title: string, statusLabel: string) {
    const parentIds = await this.access.getActiveParentIds(studentId);
    await this.events.emit('REVIEW_CREATED', [studentId, ...parentIds], {
      title: 'Домашнее задание проверено',
      body: `«${title}» — ${statusLabel}.`,
      meta: { studentId },
    });
  }

  private async loadOwnHomework(studentId: string, homeworkId: string) {
    const row = await this.db.query.homework.findFirst({ where: eq(homework.id, homeworkId) });
    if (!row || row.studentId !== studentId) throw new NotFoundException('Homework not found');
    return row;
  }
}
