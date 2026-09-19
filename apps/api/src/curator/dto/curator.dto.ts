import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { RubricDto } from '../../homework/dto/homework.dto';

export class StudentIdParamDto {
  @IsUUID()
  id: string;
}

export class PlacementAttemptIdParamDto {
  @IsUUID()
  id: string;
}

export class LessonAnswerIdParamDto {
  @IsUUID()
  id: string;
}

export class ReviewSpeakingDto {
  @ValidateNested()
  @Type(() => RubricDto)
  rubric: RubricDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class UpdateStudentPlanDto {
  @IsOptional()
  @IsIn(['A1', 'A2', 'B1', 'B2', 'C1'])
  targetLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  goal?: string;
}

export class StudentListQueryDto {
  /** Не занимался N и более дней (по последнему входу) */
  @IsOptional()
  inactiveDays?: string;

  /** Только с результатом ниже цели */
  @IsOptional()
  @IsIn(['true'])
  lowScore?: string;

  /** Только с непроверенными ДЗ/записями speaking */
  @IsOptional()
  @IsIn(['true'])
  hasPending?: string;
}
