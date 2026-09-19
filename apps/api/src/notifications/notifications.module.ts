import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env';
import { DailyCheckProcessor } from './daily-check.processor';
import { EmailService } from './email.service';
import { NotificationEventsService } from './notification-events.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';
import { SchedulerService } from './scheduler.service';
import { TelegramService } from './telegram.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({ connection: { url: config.get('REDIS_URL', { infer: true }) } }),
    }),
    BullModule.registerQueue({ name: 'notifications' }, { name: 'daily-checks' }),
  ],
  controllers: [NotificationsController],
  providers: [
    EmailService, TelegramService, NotificationsService, NotificationEventsService,
    NotificationsProcessor, DailyCheckProcessor, SchedulerService,
  ],
  exports: [NotificationEventsService, TelegramService],
})
export class NotificationsModule {}
