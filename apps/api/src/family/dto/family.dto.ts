import { IsIn, IsString, IsUUID, Length } from 'class-validator';
import { ConsentType, consentTypeEnum } from '../../db/schema';

export class LinkChildDto {
  @IsString()
  @Length(8, 8)
  code: string;
}

export class ChildParamDto {
  @IsUUID()
  childId: string;
}

export class ChildConsentParamDto extends ChildParamDto {
  @IsIn(consentTypeEnum.enumValues)
  type: ConsentType;
}

export class StudentParamDto {
  @IsUUID()
  id: string;
}

export class LessonReportParamDto extends StudentParamDto {
  @IsUUID()
  lessonId: string;
}
