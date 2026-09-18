import { Type } from 'class-transformer';
import {
  IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min,
} from 'class-validator';
import { COURSE_LEVELS } from '../../common/levels';
import { audienceEnum, exerciseTypeEnum, lessonBlockTypeEnum, skillEnum } from '../../db/schema';

// ── Курс ─────────────────────────────────────────────────
export class CreateCourseDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  title: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsIn(COURSE_LEVELS)
  level: (typeof COURSE_LEVELS)[number];

  @IsIn(audienceEnum.enumValues)
  audience: (typeof audienceEnum.enumValues)[number];

  @IsOptional() @IsBoolean()
  isDemo?: boolean;
}

export class UpdateCourseDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsIn(COURSE_LEVELS)
  level?: (typeof COURSE_LEVELS)[number];

  @IsOptional() @IsIn(audienceEnum.enumValues)
  audience?: (typeof audienceEnum.enumValues)[number];
}

export class IdParamDto {
  @IsUUID()
  id: string;
}

export class ListCoursesQueryDto {
  @IsOptional() @IsIn(COURSE_LEVELS)
  level?: string;

  @IsOptional() @IsIn(audienceEnum.enumValues)
  audience?: string;
}

// ── Модуль ───────────────────────────────────────────────
export class CreateModuleDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  title: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;
}

export class UpdateModuleDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;
}

// ── Урок ─────────────────────────────────────────────────
export class CreateLessonDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  title: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(180)
  estimatedMinutes?: number;
}

export class UpdateLessonDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(180)
  estimatedMinutes?: number;
}

// ── Блок урока ───────────────────────────────────────────
export class CreateLessonBlockDto {
  @IsIn(lessonBlockTypeEnum.enumValues)
  type: (typeof lessonBlockTypeEnum.enumValues)[number];

  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsObject()
  content?: Record<string, unknown>;
}

export class UpdateLessonBlockDto {
  @IsOptional() @IsIn(lessonBlockTypeEnum.enumValues)
  type?: (typeof lessonBlockTypeEnum.enumValues)[number];

  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsObject()
  content?: Record<string, unknown>;
}

// ── Упражнение ───────────────────────────────────────────
export class CreateExerciseDto {
  @IsIn(exerciseTypeEnum.enumValues)
  type: (typeof exerciseTypeEnum.enumValues)[number];

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;

  @IsObject()
  content: Record<string, unknown>;

  /** Какой навык проверяет упражнение — используется для пересчёта баллов после мини-теста урока. */
  @IsOptional() @IsIn(skillEnum.enumValues)
  skill?: (typeof skillEnum.enumValues)[number];
}

export class UpdateExerciseDto {
  @IsOptional() @IsIn(exerciseTypeEnum.enumValues)
  type?: (typeof exerciseTypeEnum.enumValues)[number];

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;

  @IsOptional() @IsObject()
  content?: Record<string, unknown>;

  @IsOptional() @IsIn(skillEnum.enumValues)
  skill?: (typeof skillEnum.enumValues)[number];
}
