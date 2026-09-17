import { IsIn } from 'class-validator';
import { ConsentType, consentTypeEnum } from '../../db/schema';

export class ConsentTypeDto {
  @IsIn(consentTypeEnum.enumValues)
  type: ConsentType;
}
