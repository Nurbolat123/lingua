import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min,
} from 'class-validator';
import { COURSE_LEVELS } from '../../common/levels';

export class CreateVocabularyDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  word: string;

  @IsString() @IsNotEmpty() @MaxLength(300)
  translationRu: string;

  @IsOptional() @IsString() @MaxLength(300)
  translationKk?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  definition?: string;

  @IsIn(COURSE_LEVELS)
  level: (typeof COURSE_LEVELS)[number];

  @IsOptional() @IsString() @MaxLength(100)
  transcription?: string;

  @IsOptional() @IsString() @MaxLength(500)
  audioUrl?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  examples?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  collocations?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  relatedWords?: string[];

  @IsOptional() @IsBoolean()
  isDemo?: boolean;
}

export class UpdateVocabularyDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  word?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(300)
  translationRu?: string;

  @IsOptional() @IsString() @MaxLength(300)
  translationKk?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  definition?: string;

  @IsOptional() @IsIn(COURSE_LEVELS)
  level?: (typeof COURSE_LEVELS)[number];

  @IsOptional() @IsString() @MaxLength(100)
  transcription?: string;

  @IsOptional() @IsString() @MaxLength(500)
  audioUrl?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  examples?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  collocations?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  relatedWords?: string[];
}

export class ListVocabularyQueryDto {
  @IsOptional() @IsString() @MaxLength(100)
  search?: string;

  @IsOptional() @IsIn(COURSE_LEVELS)
  level?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200)
  pageSize: number = 50;
}

export class VocabularyIdParamDto {
  @IsUUID()
  id: string;
}

export class ImportVocabularyDto {
  @IsString() @IsNotEmpty()
  csv: string;
}
