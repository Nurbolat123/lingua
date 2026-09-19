import { ArgumentsHost, Catch, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Env } from '../../config/env';
import { TelegramService } from '../../notifications/telegram.service';

const ALERT_DEDUPE_WINDOW_MS = 10 * 60 * 1000; // не слать одинаковый алерт чаще раза в 10 минут

/**
 * Отвечает клиенту так же, как стандартный обработчик Nest (ничего в формате ответа не меняется),
 * но дополнительно шлёт алерт в Telegram при неожиданной ошибке (5xx) — чтобы узнать о падении
 * сразу, а не когда пожалуется ученик или родитель. Без ALERT_TELEGRAM_CHAT_ID просто не шлёт.
 */
@Injectable()
@Catch()
export class ErrorAlertFilter extends BaseExceptionFilter {
  private readonly lastAlertAt = new Map<string, number>();

  constructor(
    httpAdapterHost: HttpAdapterHost,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService<Env, true>,
  ) {
    super(httpAdapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= 500) {
      const request = host.switchToHttp().getRequest<{ method?: string; url?: string }>();
      this.maybeAlert(request?.method ?? '?', request?.url ?? '?', status, exception);
    }
    super.catch(exception, host);
  }

  private maybeAlert(method: string, path: string, status: number, exception: unknown) {
    const chatId = this.config.get('ALERT_TELEGRAM_CHAT_ID', { infer: true });
    if (!chatId || !this.telegram.isEnabled()) return;

    const key = `${method} ${path} ${status}`;
    const now = Date.now();
    if (now - (this.lastAlertAt.get(key) ?? 0) < ALERT_DEDUPE_WINDOW_MS) return;
    this.lastAlertAt.set(key, now);

    const message = exception instanceof Error ? exception.message : String(exception);
    const text = `SoyleUp: ${status} на ${method} ${path}\n${message}`.slice(0, 3500);
    this.telegram.sendMessage(chatId, text).catch(() => {});
  }
}
