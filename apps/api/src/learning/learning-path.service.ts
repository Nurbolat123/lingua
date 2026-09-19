import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, lte, sql } from 'drizzle-orm';
import { gradeAnswer, stripAnswer } from '../common/exerciseContent';
import {
  buildEnglishProfile, COURSE_LEVELS, CourseLevel, priorityLearningPath, QUESTION_LEVELS, QuestionLevel,
  scoreToLevel, SkillName, toCourseLevel,
} from '../common/levels';
import { DB, Database } from '../db/db.module';
import {
  Audience, courseModules, courses, lessonProgress, lessons, questionBank, Skill, studentProfiles, studentVocabulary,
} from '../db/schema';
import { SkillRecalcService } from './skill-recalc.service';

@Injectable()
export class LearningPathService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly skillRecalc: SkillRecalcService,
  ) {}

  async getTodayPlan(userId: string) {
    const profile = await this.db.query.studentProfiles.findFirst({ where: eq(studentProfiles.userId, userId) });
    if (!profile) throw new BadRequestException('Student profile not found');

    const scores: Record<SkillName, number | null> = {
      GRAMMAR: profile.grammarScore,
      VOCABULARY: profile.vocabularyScore,
      READING: profile.readingScore,
      LISTENING: profile.listeningScore,
      SPEAKING: profile.speakingScore,
    };
    const priority = priorityLearningPath(scores, profile.targetLevel as CourseLevel | null);

    const courseId = profile.courseId ?? (await this.assignCourse(userId, profile.birthDate, scores));
    const lesson = courseId ? await this.findNextLesson(userId, courseId) : null;

    const dueWords = await this.db.query.studentVocabulary.findMany({
      where: and(eq(studentVocabulary.userId, userId), lte(studentVocabulary.dueAt, new Date())),
      orderBy: asc(studentVocabulary.dueAt),
      limit: 10,
      with: { word: true },
    });

    let practiceQuestion = null;
    for (const skill of priority) {
      if (skill === 'SPEAKING') continue;
      practiceQuestion = await this.pickPracticeQuestion(skill, scores[skill]);
      if (practiceQuestion) break;
    }

    return {
      prioritySkills: priority.slice(0, 3),
      dailyMinutes: profile.dailyMinutes,
      lesson,
      vocabularyReview: {
        total: dueWords.length,
        words: dueWords.map((w) => ({ id: w.word.id, word: w.word.word, translationRu: w.word.translationRu })),
      },
      practiceQuestion,
    };
  }

  /** Подбирает курс по возрасту (аудитория) и ближайшему к текущему уровню ученика. */
  private async assignCourse(userId: string, birthDate: string, scores: Record<SkillName, number | null>) {
    const audience = this.audienceFor(birthDate);
    const byAudience = await this.db.query.courses.findMany({ where: eq(courses.audience, audience) });
    const pool = byAudience.length ? byAudience : await this.db.query.courses.findMany();
    if (!pool.length) return null;

    const overallLevel: QuestionLevel | null = buildEnglishProfile(scores).overallLevel;
    const targetIdx = COURSE_LEVELS.indexOf(overallLevel ? toCourseLevel(overallLevel) : 'B1');
    const best = pool.reduce((a, b) => {
      const da = Math.abs(COURSE_LEVELS.indexOf(a.level as CourseLevel) - targetIdx);
      const db_ = Math.abs(COURSE_LEVELS.indexOf(b.level as CourseLevel) - targetIdx);
      return db_ < da ? b : a;
    });

    await this.db.update(studentProfiles).set({ courseId: best.id }).where(eq(studentProfiles.userId, userId));
    return best.id;
  }

  private audienceFor(birthDate: string): Audience {
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 13) return 'KIDS';
    if (age < 18) return 'TEENS';
    return 'ADULTS';
  }

  private async findNextLesson(userId: string, courseId: string) {
    const course = await this.db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: { modules: { orderBy: asc(courseModules.order), with: { lessons: { orderBy: asc(lessons.order) } } } },
    });
    const allLessons = course?.modules.flatMap((m) => m.lessons) ?? [];
    if (!allLessons.length) return null;

    const progressRows = await this.db.query.lessonProgress.findMany({
      where: and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, allLessons.map((l) => l.id))),
    });
    const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

    const next = allLessons.find((l) => progressByLesson.get(l.id)?.status !== 'COMPLETED');
    if (!next) return null; // курс пройден полностью

    const progress = progressByLesson.get(next.id);
    return {
      id: next.id,
      title: next.title,
      estimatedMinutes: next.estimatedMinutes,
      status: progress?.status ?? 'NOT_STARTED',
      currentBlockOrder: progress?.currentBlockOrder ?? 0,
    };
  }

  /** Ответ на практическое задание дня (тот же банк, что и в placement-тесте). */
  async submitPracticeAnswer(userId: string, questionId: string, answer: unknown) {
    const question = await this.db.query.questionBank.findFirst({ where: eq(questionBank.id, questionId) });
    if (!question) throw new NotFoundException('Question not found');
    if (question.type === 'SPEAKING') throw new BadRequestException('Speaking questions are not auto-graded here');

    const isCorrect = gradeAnswer(question.type, question.content as Record<string, unknown>, answer) ?? false;
    await this.skillRecalc.recalcSkillAfterMiniTest(userId, question.skill, isCorrect);

    const content = question.content as Record<string, unknown>;
    return { isCorrect, explanation: (content.explanation as string | undefined) ?? null };
  }

  /** Ищет вопрос на уровне ученика; если банк пуст на этом уровне — берёт ближайший доступный. */
  private async pickPracticeQuestion(skill: SkillName, currentScore: number | null) {
    const startLevel = currentScore == null ? 'B1' : scoreToLevel(currentScore);
    const startIdx = QUESTION_LEVELS.indexOf(startLevel);
    for (let offset = 0; offset < QUESTION_LEVELS.length; offset++) {
      for (const idx of offset === 0 ? [startIdx] : [startIdx - offset, startIdx + offset]) {
        if (idx < 0 || idx >= QUESTION_LEVELS.length) continue;
        const q = await this.db.query.questionBank.findFirst({
          where: and(eq(questionBank.skill, skill as Skill), eq(questionBank.level, QUESTION_LEVELS[idx])),
          orderBy: sql`random()`,
        });
        if (q) {
          return {
            id: q.id,
            skill: q.skill,
            level: q.level,
            type: q.type,
            content: stripAnswer(q.type, q.content as Record<string, unknown>),
          };
        }
      }
    }
    return null;
  }
}
