import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, SQL } from 'drizzle-orm';
import { definedOnly } from '../common/utils';
import { DB, Database } from '../db/db.module';
import {
  courses, courseModules, Exercise, ExerciseType, exercises, lessonBlocks, lessons,
} from '../db/schema';
import {
  CreateCourseDto, CreateExerciseDto, CreateLessonBlockDto, CreateLessonDto, CreateModuleDto,
  ListCoursesQueryDto, UpdateCourseDto, UpdateExerciseDto, UpdateLessonBlockDto, UpdateLessonDto, UpdateModuleDto,
} from './dto/courses.dto';

/** Убирает правильный ответ из содержимого упражнения — для просмотра «глазами ученика». */
function stripAnswer(type: ExerciseType, content: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const { correctIndex: _c, explanation: _e, ...rest } = content;
      return rest;
    }
    case 'FILL_BLANK': {
      const { answers: _a, ...rest } = content;
      return rest;
    }
    case 'MATCHING': {
      const pairs = (content.pairs as { left: string; right: string }[] | undefined) ?? [];
      return { left: pairs.map((p) => p.left), right: pairs.map((p) => p.right) };
    }
    case 'ORDERING': {
      const { correctOrder: _o, ...rest } = content;
      return rest;
    }
    case 'FREE_RESPONSE': {
      const { sampleAnswer: _s, rubric: _r, ...rest } = content;
      return rest;
    }
    case 'SPEAKING': {
      const { rubric: _r2, ...rest } = content;
      return rest;
    }
    default:
      return content;
  }
}

@Injectable()
export class CoursesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  // ── Курсы ──────────────────────────────────────────────
  listCourses(q: ListCoursesQueryDto) {
    const conditions: (SQL | undefined)[] = [];
    if (q.level) conditions.push(eq(courses.level, q.level));
    if (q.audience) conditions.push(eq(courses.audience, q.audience as (typeof courses.audience.enumValues)[number]));
    return this.db.query.courses.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: asc(courses.createdAt),
    });
  }

  async getCourse(id: string) {
    const course = await this.db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        modules: {
          orderBy: asc(courseModules.order),
          with: { lessons: { orderBy: asc(lessons.order) } },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async createCourse(dto: CreateCourseDto) {
    const [row] = await this.db.insert(courses).values(dto).returning();
    return row;
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    const [row] = await this.db.update(courses).set(definedOnly(dto)).where(eq(courses.id, id)).returning();
    if (!row) throw new NotFoundException('Course not found');
    return row;
  }

  async deleteCourse(id: string) {
    const rows = await this.db.delete(courses).where(eq(courses.id, id)).returning({ id: courses.id });
    if (!rows.length) throw new NotFoundException('Course not found');
    return { ok: true };
  }

  // ── Модули ─────────────────────────────────────────────
  async createModule(courseId: string, dto: CreateModuleDto) {
    await this.assertCourseExists(courseId);
    const [row] = await this.db.insert(courseModules).values({ ...dto, courseId }).returning();
    return row;
  }

  async updateModule(id: string, dto: UpdateModuleDto) {
    const [row] = await this.db.update(courseModules).set(definedOnly(dto)).where(eq(courseModules.id, id)).returning();
    if (!row) throw new NotFoundException('Module not found');
    return row;
  }

  async deleteModule(id: string) {
    const rows = await this.db.delete(courseModules).where(eq(courseModules.id, id)).returning({ id: courseModules.id });
    if (!rows.length) throw new NotFoundException('Module not found');
    return { ok: true };
  }

  // ── Уроки ──────────────────────────────────────────────
  async createLesson(moduleId: string, dto: CreateLessonDto) {
    await this.assertModuleExists(moduleId);
    const [row] = await this.db.insert(lessons).values({ ...dto, moduleId }).returning();
    return row;
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    const [row] = await this.db.update(lessons).set(definedOnly(dto)).where(eq(lessons.id, id)).returning();
    if (!row) throw new NotFoundException('Lesson not found');
    return row;
  }

  async deleteLesson(id: string) {
    const rows = await this.db.delete(lessons).where(eq(lessons.id, id)).returning({ id: lessons.id });
    if (!rows.length) throw new NotFoundException('Lesson not found');
    return { ok: true };
  }

  async getLesson(id: string) {
    const lesson = await this.db.query.lessons.findFirst({
      where: eq(lessons.id, id),
      with: {
        blocks: {
          orderBy: asc(lessonBlocks.order),
          with: { exercises: { orderBy: asc(exercises.order) } },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  /** То же самое, но без правильных ответов — как увидит ученик. */
  async previewLesson(id: string) {
    const lesson = await this.getLesson(id);
    return {
      ...lesson,
      blocks: lesson.blocks.map((block) => ({
        ...block,
        exercises: block.exercises.map((ex: Exercise) => ({
          ...ex,
          content: stripAnswer(ex.type, ex.content as Record<string, unknown>),
        })),
      })),
    };
  }

  // ── Блоки урока ────────────────────────────────────────
  async createBlock(lessonId: string, dto: CreateLessonBlockDto) {
    await this.assertLessonExists(lessonId);
    const [row] = await this.db.insert(lessonBlocks).values({ ...dto, lessonId }).returning();
    return row;
  }

  async updateBlock(id: string, dto: UpdateLessonBlockDto) {
    const [row] = await this.db.update(lessonBlocks).set(definedOnly(dto)).where(eq(lessonBlocks.id, id)).returning();
    if (!row) throw new NotFoundException('Lesson block not found');
    return row;
  }

  async deleteBlock(id: string) {
    const rows = await this.db.delete(lessonBlocks).where(eq(lessonBlocks.id, id)).returning({ id: lessonBlocks.id });
    if (!rows.length) throw new NotFoundException('Lesson block not found');
    return { ok: true };
  }

  // ── Упражнения ─────────────────────────────────────────
  async createExercise(lessonBlockId: string, dto: CreateExerciseDto) {
    await this.assertBlockExists(lessonBlockId);
    const [row] = await this.db.insert(exercises).values({ ...dto, lessonBlockId }).returning();
    return row;
  }

  async updateExercise(id: string, dto: UpdateExerciseDto) {
    const [row] = await this.db.update(exercises).set(definedOnly(dto)).where(eq(exercises.id, id)).returning();
    if (!row) throw new NotFoundException('Exercise not found');
    return row;
  }

  async deleteExercise(id: string) {
    const rows = await this.db.delete(exercises).where(eq(exercises.id, id)).returning({ id: exercises.id });
    if (!rows.length) throw new NotFoundException('Exercise not found');
    return { ok: true };
  }

  private async assertCourseExists(id: string) {
    const row = await this.db.query.courses.findFirst({ where: eq(courses.id, id), columns: { id: true } });
    if (!row) throw new NotFoundException('Course not found');
  }

  private async assertModuleExists(id: string) {
    const row = await this.db.query.courseModules.findFirst({ where: eq(courseModules.id, id), columns: { id: true } });
    if (!row) throw new NotFoundException('Module not found');
  }

  private async assertLessonExists(id: string) {
    const row = await this.db.query.lessons.findFirst({ where: eq(lessons.id, id), columns: { id: true } });
    if (!row) throw new NotFoundException('Lesson not found');
  }

  private async assertBlockExists(id: string) {
    const row = await this.db.query.lessonBlocks.findFirst({ where: eq(lessonBlocks.id, id), columns: { id: true } });
    if (!row) throw new NotFoundException('Lesson block not found');
  }
}
