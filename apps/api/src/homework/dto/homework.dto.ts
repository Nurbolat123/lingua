import { Type } from 'class-transformer';
import {
  IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateIf, ValidateNested,
} from 'class-validator';

export class HomeworkIdParamDto {
  @IsUUID()
  id: string;
}

export class AssignHomeworkDto {
  @IsUUID()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  instructions?: string;

  @IsOptional()
  @IsBoolean()
  requiresIntegrityCheck?: boolean;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}

export class IntegritySignalsDto {
  @IsInt()
  @Min(0)
  tabAwayCount: number;

  @IsInt()
  @Min(0)
  fullscreenExitCount: number;

  @IsBoolean()
  pasteDetected: boolean;
}

export class SubmitHomeworkDto {
  @ValidateIf((o: SubmitHomeworkDto) => !o.audioKey)
  @IsString()
  @IsNotEmpty()
  text?: string;

  @ValidateIf((o: SubmitHomeworkDto) => !o.text)
  @IsString()
  @IsNotEmpty()
  audioKey?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => IntegritySignalsDto)
  integritySignals?: IntegritySignalsDto;
}

export class RubricDto {
  @IsInt()
  @Min(1)
  @Max(5)
  vocabulary: number;

  @IsInt()
  @Min(1)
  @Max(5)
  grammar: number;

  @IsInt()
  @Min(1)
  @Max(5)
  fluency: number;

  @IsInt()
  @Min(1)
  @Max(5)
  pronunciation: number;
}

export class ReviewHomeworkDto {
  @IsIn(['APPROVE', 'RETURN'])
  action: 'APPROVE' | 'RETURN';

  @IsOptional()
  @ValidateNested()
  @Type(() => RubricDto)
  rubric?: RubricDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

