import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { NotificationType } from '../db/schema';

export interface NotificationPayload {
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}

/** Единая точка входа для остальных модулей: поставить уведомление в очередь на доставку. */
@Injectable()
export class NotificationEventsService {
  constructor(@InjectQueue('notifications') private readonly queue: Queue) {}

  async emit(type: NotificationType, recipientUserIds: string[], payload: NotificationPayload): Promise<void> {
    const unique = [...new Set(recipientUserIds)];
    await Promise.all(
      unique.map((userId) =>
        this.queue.add('deliver', { userId, type, title: payload.title, body: payload.body, meta: payload.meta ?? null }),
      ),
    );
  }
}
