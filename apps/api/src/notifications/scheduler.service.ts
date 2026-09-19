import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

const DAILY_CHECK_SCHEDULER_ID = 'daily-missed-and-overdue-check';

/** Регистрирует ежедневную повторяющуюся задачу — 20:00 по времени Астаны (Asia/Almaty). */
@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(@InjectQueue('daily-checks') private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(DAILY_CHECK_SCHEDULER_ID, { pattern: '0 20 * * *', tz: 'Asia/Almaty' }, { name: 'daily-check' });
    this.logger.log('Ежедневная проверка пропусков и просрочек зарегистрирована (20:00 Asia/Almaty).');
  }
}
