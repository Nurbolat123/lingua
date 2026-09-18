import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { AccessService } from '../common/access.service';
import { AuthUser } from '../common/auth.decorators';
import { buildEnglishProfile, TARGET_SCORE_BY_LEVEL } from '../common/levels';
import { DB, Database } from '../db/db.module';
import {
  curatorStudents, exercises, homework, lessonExerciseAnswers, lessonProgress, lessons, placementAttempts,
  studentProfiles, users,
} from '../db/schema';
import { UpdateStudentPlanDto } from './dto/curator.dto';

@Injectable()
export class CuratorStudentsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly access: AccessService,
  ) {}

  async myStudents(curatorId: string, filters: { inactiveDays?: number; lowScore?: boolean; hasPending?: boolean }) {
    const rows = await this.db.query.curatorStudents.findMany({
      where: and(eq(curatorStudents.curatorId, curatorId), eq(curatorStudents.active, true)),
      columns: { assignedAt: true },
      orderBy: desc(curatorStudents.assignedAt),
      with: {
        student: {
          columns: { id: true, firstName: true, lastName: true, status: true, lastLoginAt: true },
          with: { studentProfile: true },
        },
      },
    });

    let list = rows.map(({ student, assignedAt }) => {
      const { studentProfile, ...rest } = student;
      const englishProfile = studentProfile
        ? buildEnglishProfile({
            GRAMMAR: studentProfile.grammarScore, VOCABULARY: studentProfile.vocabularyScore,
            READING: studentProfile.readingScore, LISTENING: studentProfile.listeningScore, SPEAKING: studentProfile.speakingScore,
          })
        : null;
      return {
        ...rest,
        assignedAt,
        englishProfile,
        studentProfile: studentProfile
          ? { isMinor: studentProfile.isMinor, targetLevel: studentProfile.targetLevel, dailyMinutes: studentProfile.dailyMinutes }
          : null,
      };
    });

    if (filters.inactiveDays != null) {
      const cutoff = new Date(Date.now() - filters.inactiveDays * 24 * 60 * 60 * 1000);
      list = list.filter((s) => !s.lastLoginAt || new Date(s.lastLoginAt) < cutoff);
    }
    if (filters.lowScore) {
      list = list.filter((s) => {
        const target = TARGET_SCORE_BY_LEVEL[(s.studentProfile?.targetLevel as keyof typeof TARGET_SCORE_BY_LEVEL) ?? 'B1'];
        return s.englishProfile?.overall == null || s.englishProfile.overall < target;
      });
    }
    if (filters.hasPending) {
      const studentIds = list.map((s) => s.id);
      const pendingIds = await this.studentsWithPending(studentIds);
      list = list.filter((s) => pendingIds.has(s.id));
    }

    return list;
  }

  private async studentsWithPending(studentIds: string[]): Promise<Set<string>> {
    if (!studentIds.length) return new Set();
    const result = new Set<string>();

    const pendingHomework = await this.db.query.homework.findMany({
      where: and(inArray(homework.studentId, studentIds), eq(homework.status, 'SUBMITTED')),
      columns: { studentId: true },
    });
    pendingHomework.forEach((h) => result.add(h.studentId));

    const pendingPlacement = await this.db.query.placementAttempts.findMany({
      where: and(
        inArray(placementAttempts.userId, studentIds),
        eq(placementAttempts.status, 'COMPLETED'),
        sql`${placementAttempts.results} -> 'SPEAKING' ->> 'status' = 'PENDING'`,
      ),
      columns: { userId: true },
    });
    pendingPlacement.forEach((a) => a.userId && result.add(a.userId));

    const pendingLesson = await this.db
      .select({ userId: lessonProgress.userId })
      .from(lessonExerciseAnswers)
      .innerJoin(lessonProgress, eq(lessonExerciseAnswers.progressId, lessonProgress.id))
      .innerJoin(exercises, eq(lessonExerciseAnswers.exerciseId, exercises.id))
      .where(
        and(
          inArray(lessonProgress.userId, studentIds),
          eq(exercises.type, 'SPEAKING'),
          isNull(lessonExerciseAnswers.reviewedAt),
        ),
      );
    pendingLesson.forEach((r) => result.add(r.userId));

    return result;
  }

  /** Карточка ученика: профиль + ошибки в упражнениях (для куратора) */
  async studentCard(actor: AuthUser, studentId: string) {
    await this.access.assertCanViewStudent(actor, studentId);
    const student = await this.db.query.users.findFirst({
      where: eq(users.id, studentId),
      columns: { id: true, firstName: true, lastName: true, status: true, locale: true, lastLoginAt: true, createdAt: true },
      with: { studentProfile: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const { studentProfile, ...rest } = student;
    const englishProfile = studentProfile
      ? buildEnglishProfile({
          GRAMMAR: studentProfile.grammarScore, VOCABULARY: studentProfile.vocabularyScore,
          READING: studentProfile.readingScore, LISTENING: studentProfile.listeningScore, SPEAKING: studentProfile.speakingScore,
        })
      : null;

    return {
      ...rest,
      englishProfile,
      studentProfile: studentProfile
        ? {
            isMinor: studentProfile.isMinor, targetLevel: studentProfile.targetLevel, goal: studentProfile.goal,
            dailyMinutes: studentProfile.dailyMinutes, grammarScore: studentProfile.grammarScore,
            vocabularyScore: studentProfile.vocabularyScore, readingScore: studentProfile.readingScore,
            listeningScore: studentProfile.listeningScore, speakingScore: studentProfile.speakingScore,
          }
        : null,
    };
  }

  /** Последние неверные ответы в уроках — для раздела «ошибки» в карточке ученика */
  async recentMistakes(actor: AuthUser, studentId: string, limit = 20) {
    await this.access.assertCanViewStudent(actor, studentId);
    return this.db
      .select({
        id: lessonExerciseAnswers.id,
        answeredAt: lessonExerciseAnswers.answeredAt,
        exerciseContent: exercises.content,
        exerciseType: exercises.type,
        exerciseSkill: exercises.skill,
        lessonTitle: lessons.title,
      })
      .from(lessonExerciseAnswers)
      .innerJoin(lessonProgress, eq(lessonExerciseAnswers.progressId, lessonProgress.id))
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .innerJoin(exercises, eq(lessonExerciseAnswers.exerciseId, exercises.id))
      .where(and(eq(lessonProgress.userId, studentId), eq(lessonExerciseAnswers.isCorrect, false)))
      .orderBy(desc(lessonExerciseAnswers.answeredAt))
      .limit(limit);
  }

  /** Все записи речи ученика (тест + уроки) — для раздела «записи speaking» */
  async speakingRecordings(actor: AuthUser, studentId: string) {
    await this.access.assertCanViewStudent(actor, studentId);
    const lessonRecordings = await this.db
      .select({
        id: lessonExerciseAnswers.id,
        answeredAt: lessonExerciseAnswers.answeredAt,
        reviewedAt: lessonExerciseAnswers.reviewedAt,
        lessonTitle: lessons.title,
      })
      .from(lessonExerciseAnswers)
      .innerJoin(lessonProgress, eq(lessonExerciseAnswers.progressId, lessonProgress.id))
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .innerJoin(exercises, eq(lessonExerciseAnswers.exerciseId, exercises.id))
      .where(and(eq(lessonProgress.userId, studentId), eq(exercises.type, 'SPEAKING'), sql`${lessonExerciseAnswers.audioKey} is not null`))
      .orderBy(desc(lessonExerciseAnswers.answeredAt));

    const placementAttemptsRows = await this.db.query.placementAttempts.findMany({
      where: and(eq(placementAttempts.userId, studentId), eq(placementAttempts.status, 'COMPLETED')),
      columns: { id: true, completedAt: true, results: true },
    });

    return {
      lesson: lessonRecordings.map((r) => ({ type: 'LESSON' as const, id: r.id, at: r.answeredAt, reviewed: !!r.reviewedAt, title: r.lessonTitle })),
      placement: placementAttemptsRows
        .filter((a) => (a.results as Record<string, unknown> | null)?.SPEAKING)
        .map((a) => ({
          type: 'PLACEMENT' as const,
          id: a.id,
          at: a.completedAt,
          reviewed: (a.results as Record<string, { status: string }>).SPEAKING?.status === 'REVIEWED',
        })),
    };
  }

  async updatePlan(actor: AuthUser, studentId: string, dto: UpdateStudentPlanDto) {
    await this.access.assertCanViewStudent(actor, studentId);
    if (!Object.keys(dto).length) return this.studentCard(actor, studentId);
    await this.db.update(studentProfiles).set(dto).where(eq(studentProfiles.userId, studentId));
    return this.studentCard(actor, studentId);
  }
}
