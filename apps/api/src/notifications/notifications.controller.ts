import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/auth.decorators';
import { NotificationIdParamDto, NotificationTypeParamDto, UpdateNotificationSettingDto } from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const [items, unread] = await Promise.all([
      this.notifications.list(user.id),
      this.notifications.unreadCount(user.id),
    ]);
    return { items, unread };
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param() params: NotificationIdParamDto) {
    return this.notifications.markRead(user.id, params.id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: AuthUser) {
    return this.notifications.getSettings(user.id);
  }

  @Patch('settings/:type')
  updateSetting(
    @CurrentUser() user: AuthUser,
    @Param() params: NotificationTypeParamDto,
    @Body() dto: UpdateNotificationSettingDto,
  ) {
    return this.notifications.updateSetting(user.id, params.type, dto);
  }

  @Get('telegram/status')
  telegramStatus(@CurrentUser() user: AuthUser) {
    return this.notifications.telegramStatus(user.id);
  }

  @Post('telegram/link-code')
  createTelegramLinkCode(@CurrentUser() user: AuthUser) {
    return this.notifications.createTelegramLinkCode(user.id);
  }

  @Delete('telegram/link')
  unlinkTelegram(@CurrentUser() user: AuthUser) {
    return this.notifications.unlinkTelegram(user.id);
  }
}
