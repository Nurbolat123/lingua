import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { QUESTION_LEVELS } from '../../common/levels';
import { exerciseTypeEnum, skillEnum } from '../../db/schema';

export class CreateQuestionDto {
  @IsIn(skillEnum.enumValues)
  skill: (typeof skillEnum.enumValues)[number];

  @IsIn(QUESTION_LEVELS)
  level: (typeof QUESTION_LEVELS)[number];

  @IsOptional() @IsInt() @Min(1) @Max(5)
  difficulty?: number;

  @IsIn(exerciseTypeEnum.enumValues)
  type: (typeof exerciseTypeEnum.enumValues)[number];

  @IsObject()
  content: Record<string, unknown>;
}

export class UpdateQuestionDto {
  @IsOptional() @IsIn(skillEnum.enumValues)
  skill?: (typeof skillEnum.enumValues)[number];

  @IsOptional() @IsIn(QUESTION_LEVELS)
  level?: (typeof QUESTION_LEVELS)[number];

  @IsOptional() @IsInt() @Min(1) @Max(5)
  difficulty?: number;

  @IsOptional() @IsIn(exerciseTypeEnum.enumValues)
  type?: (typeof exerciseTypeEnum.enumValues)[number];

  @IsOptional() @IsObject()
  content?: Record<string, unknown>;
}

export class ListQuestionsQueryDto {
  @IsOptional() @IsIn(skillEnum.enumValues)
  skill?: string;

  @IsOptional() @IsIn(QUESTION_LEVELS)
  level?: string;

  @IsOptional() @IsIn(exerciseTypeEnum.enumValues)
  type?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200)
  pageSize: number = 50;
}

export class QuestionIdParamDto {
  @IsUUID()
  id: string;
}

export class ImportQuestionsDto {
  @IsString() @IsNotEmpty()
  csv: string;
}
