import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { randomInt } from 'node:crypto';
import { isUniqueViolation } from '../common/utils';
import { DB, Database } from '../db/db.module';
import { NotificationType, notifications, notificationSettings, notificationTypeEnum, telegramLinks } from '../db/schema';
import { TelegramService } from './telegram.service';

const LINK_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без 0/O и 1/I
const LINK_CODE_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly telegram: TelegramService,
  ) {}

  async list(userId: string, limit = 50) {
    return this.db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: desc(notifications.createdAt),
      limit,
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.db.$count(notifications, and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }

  async markRead(userId: string, id: string) {
    await this.db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { ok: true };
  }

  async getSettings(userId: string) {
    const rows = await this.db.query.notificationSettings.findMany({ where: eq(notificationSettings.userId, userId) });
    const byType = new Map(rows.map((r) => [r.type, r]));
    return notificationTypeEnum.enumValues.map((type) => {
      const row = byType.get(type);
      return { type, inApp: row?.inApp ?? true, email: row?.email ?? true, telegram: row?.telegram ?? true };
    });
  }

  async updateSetting(userId: string, type: NotificationType, dto: { inApp?: boolean; email?: boolean; telegram?: boolean }) {
    const existing = await this.db.query.notificationSettings.findFirst({
      where: and(eq(notificationSettings.userId, userId), eq(notificationSettings.type, type)),
    });
    if (existing) {
      await this.db.update(notificationSettings).set(dto).where(eq(notificationSettings.id, existing.id));
    } else {
      await this.db.insert(notificationSettings).values({
        userId, type, inApp: dto.inApp ?? true, email: dto.email ?? true, telegram: dto.telegram ?? true,
      });
    }
    return { ok: true };
  }

  async telegramStatus(userId: string) {
    const link = await this.db.query.telegramLinks.findFirst({ where: eq(telegramLinks.userId, userId) });
    return { linked: !!link?.chatId, botAvailable: this.telegram.isEnabled() };
  }

  async createTelegramLinkCode(userId: string) {
    const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Array.from({ length: 8 }, () => LINK_CODE_ALPHABET[randomInt(LINK_CODE_ALPHABET.length)]).join('');
      try {
        await this.db
          .insert(telegramLinks)
          .values({ userId, linkCode: code, linkCodeExpiresAt: expiresAt })
          .onConflictDoUpdate({ target: telegramLinks.userId, set: { linkCode: code, linkCodeExpiresAt: expiresAt } });
        const botUsername = this.telegram.getBotUsername();
        return { code, expiresAt, botUsername, deepLink: botUsername ? `https://t.me/${botUsername}?start=${code}` : null };
      } catch (e) {
        if (!isUniqueViolation(e)) throw e;
      }
    }
    throw new ConflictException('Could not generate a code, try again');
  }

  async unlinkTelegram(userId: string) {
    await this.db.update(telegramLinks).set({ chatId: null, linkedAt: null }).where(eq(telegramLinks.userId, userId));
    return { ok: true };
  }
}
