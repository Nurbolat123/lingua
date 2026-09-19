import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { notificationTypeEnum } from '../../db/schema';

export class NotificationIdParamDto {
  @IsUUID()
  id: string;
}

export class NotificationTypeParamDto {
  @IsIn(notificationTypeEnum.enumValues)
  type: (typeof notificationTypeEnum.enumValues)[number];
}

export class UpdateNotificationSettingDto {
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  telegram?: boolean;
}
