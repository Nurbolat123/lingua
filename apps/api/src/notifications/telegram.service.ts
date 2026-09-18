import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, gt } from 'drizzle-orm';
import { Env } from '../config/env';
import { DB, Database } from '../db/db.module';
import { telegramLinks } from '../db/schema';

const POLL_TIMEOUT_SECONDS = 25;

/** Канал Telegram — необязателен. Без токена бот просто не запускается, канал выключен. */
@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private token: string | undefined;
  private botUsername: string | null = null;
  private offset = 0;
  private stopped = false;

  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(DB) private readonly db: Database,
  ) {}

  async onModuleInit() {
    this.token = this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    if (!this.token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — Telegram-уведомления отключены.');
      return;
    }
    try {
      const me = await this.call('getMe');
      this.botUsername = (me.result as { username: string }).username;
      this.logger.log(`Telegram-бот запущен: @${this.botUsername}`);
      this.poll();
    } catch (e) {
      this.logger.error(`Не удалось запустить Telegram-бота: ${(e as Error).message}`);
    }
  }

  onModuleDestroy() {
    this.stopped = true;
  }

  isEnabled(): boolean {
    return !!this.botUsername;
  }

  getBotUsername(): string | null {
    return this.botUsername;
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.token) return;
    try {
      await this.call('sendMessage', { chat_id: chatId, text });
    } catch (e) {
      this.logger.error(`Не удалось отправить сообщение в Telegram (${chatId}): ${(e as Error).message}`);
    }
  }

  private async poll() {
    while (!this.stopped) {
      try {
        const res = await this.call('getUpdates', { offset: this.offset, timeout: POLL_TIMEOUT_SECONDS });
        for (const update of res.result as TelegramUpdate[]) {
          this.offset = update.update_id + 1;
          await this.handleUpdate(update);
        }
      } catch (e) {
        this.logger.warn(`Telegram polling error: ${(e as Error).message}`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  private async handleUpdate(update: TelegramUpdate) {
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat.id;
    if (!text || !chatId) return;

    const match = text.match(/^\/start\s+(\S+)/);
    if (!match) {
      await this.sendMessage(
        String(chatId),
        'Привет! Чтобы привязать аккаунт SoyleUp, откройте ссылку из настроек уведомлений на сайте.',
      );
      return;
    }
    const code = match[1].toUpperCase();
    const link = await this.db.query.telegramLinks.findFirst({
      where: and(eq(telegramLinks.linkCode, code), gt(telegramLinks.linkCodeExpiresAt, new Date())),
    });
    if (!link) {
      await this.sendMessage(String(chatId), 'Код недействителен или истёк. Получите новый на сайте.');
      return;
    }
    await this.db
      .update(telegramLinks)
      .set({ chatId: String(chatId), linkedAt: new Date(), linkCode: null, linkCodeExpiresAt: null })
      .where(eq(telegramLinks.userId, link.userId));
    await this.sendMessage(String(chatId), 'Готово! Аккаунт привязан, теперь вы будете получать уведомления здесь.');
  }

  private async call(method: string, params: Record<string, unknown> = {}): Promise<{ ok: boolean; result: unknown }> {
    const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const body = await res.json();
    if (!body.ok) throw new Error(body.description ?? 'Telegram API error');
    return body;
  }
}

interface TelegramUpdate {
  update_id: number;
  message?: { chat: { id: number }; text?: string };
}
