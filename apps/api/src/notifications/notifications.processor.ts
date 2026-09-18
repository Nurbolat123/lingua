import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { and, eq } from 'drizzle-orm';
import { DB, Database } from '../db/db.module';
import { NotificationType, notifications, notificationSettings, telegramLinks, users } from '../db/schema';
import { EmailService } from './email.service';
import { TelegramService } from './telegram.service';

interface DeliverJobData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  meta: Record<string, unknown> | null;
}

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly email: EmailService,
    private readonly telegram: TelegramService,
  ) {
    super();
  }

  async process(job: Job<DeliverJobData>) {
    const { userId, type, title, body, meta } = job.data;

    const settings = await this.db.query.notificationSettings.findFirst({
      where: and(eq(notificationSettings.userId, userId), eq(notificationSettings.type, type)),
    });
    const inApp = settings?.inApp ?? true;
    const emailEnabled = settings?.email ?? true;
    const telegramEnabled = settings?.telegram ?? true;

    if (inApp) {
      await this.db.insert(notifications).values({ userId, type, title, body, meta });
    }

    if (emailEnabled && this.email.isEnabled()) {
      const user = await this.db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true } });
      if (user) await this.email.send(user.email, title, body);
    }

    if (telegramEnabled && this.telegram.isEnabled()) {
      const link = await this.db.query.telegramLinks.findFirst({ where: eq(telegramLinks.userId, userId) });
      if (link?.chatId) await this.telegram.sendMessage(link.chatId, `${title}\n\n${body}`);
    }
  }
}
