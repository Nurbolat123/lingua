import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { and, eq, inArray, isNotNull, lt, max } from 'drizzle-orm';
import { AccessService } from '../common/access.service';
import { DB, Database } from '../db/db.module';
import { homework, lessonProgress, users } from '../db/schema';
import { NotificationEventsService } from './notification-events.service';

function almatyDateStr(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty' }).format(d);
}

@Processor('daily-checks')
export class DailyCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(DailyCheckProcessor.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly events: NotificationEventsService,
    private readonly access: AccessService,
  ) {
    super();
  }

  async process() {
    await this.checkMissedLessons();
    await this.checkOverdueAssignments();
  }

  private async checkMissedLessons() {
    const today = almatyDateStr(new Date());

    const students = await this.db.query.users.findMany({
      where: eq(users.status, 'ACTIVE'),
      columns: { id: true, firstName: true },
      with: { studentProfile: { columns: { courseId: true } } },
    });
    const activeStudents = students.filter((s) => s.studentProfile?.courseId);
    if (!activeStudents.length) return;

    const lastActivity = await this.db
      .select({ userId: lessonProgress.userId, lastAt: max(lessonProgress.updatedAt) })
      .from(lessonProgress)
      .where(inArray(lessonProgress.userId, activeStudents.map((s) => s.id)))
      .groupBy(lessonProgress.userId);
    const lastActivityMap = new Map(lastActivity.map((r) => [r.userId, r.lastAt]));

    for (const student of activeStudents) {
      const lastAt = lastActivityMap.get(student.id);
      const studiedToday = lastAt && almatyDateStr(new Date(lastAt)) === today;
      if (studiedToday) continue;

      const parentIds = await this.access.getActiveParentIds(student.id);
      const recipients = [student.id, ...parentIds];
      await this.events.emit('LESSON_MISSED', recipients, {
        title: 'Пропущен день занятий',
        body: `${student.firstName} сегодня ещё не занимался. Хороший момент, чтобы пройти урок!`,
        meta: { studentId: student.id },
      });
    }
    this.logger.log(`Проверка пропусков: ${activeStudents.length} учеников.`);
  }

  private async checkOverdueAssignments() {
    const overdue = await this.db.query.homework.findMany({
      where: and(lt(homework.dueAt, new Date()), inArray(homework.status, ['ASSIGNED', 'RETURNED']), isNotNull(homework.dueAt)),
      with: { student: { columns: { id: true, firstName: true } } },
    });

    for (const hw of overdue) {
      const parentIds = await this.access.getActiveParentIds(hw.studentId);
      const recipients = [hw.studentId, ...parentIds];
      await this.events.emit('ASSIGNMENT_OVERDUE', recipients, {
        title: 'Домашнее задание просрочено',
        body: `«${hw.title}» — срок сдачи прошёл. Пожалуйста, выполните задание.`,
        meta: { studentId: hw.studentId, homeworkId: hw.id },
      });
    }
    this.logger.log(`Проверка просрочек: ${overdue.length} заданий.`);
  }
}
