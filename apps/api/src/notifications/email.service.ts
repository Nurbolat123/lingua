import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { Env } from '../config/env';

/** Канал email — необязателен. Если SMTP не настроен, просто ничего не отправляет (как MinIO). */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private fromEmail = '';
  private fromName = '';

  constructor(private readonly config: ConfigService<Env, true>) {}

  onModuleInit() {
    const host = this.config.get('SMTP_HOST', { infer: true });
    const port = this.config.get('SMTP_PORT', { infer: true });
    const user = this.config.get('SMTP_USER', { infer: true });
    const password = this.config.get('SMTP_PASSWORD', { infer: true });
    this.fromEmail = this.config.get('SMTP_FROM_EMAIL', { infer: true });
    this.fromName = this.config.get('SMTP_FROM_NAME', { infer: true });

    if (!host || !port || !user || !password) {
      this.logger.warn('SMTP не настроен — email-уведомления отключены.');
      return;
    }
    this.transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass: password } });
  }

  isEnabled(): boolean {
    return this.transporter !== null;
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({ from: `"${this.fromName}" <${this.fromEmail}>`, to, subject, text });
    } catch (e) {
      this.logger.error(`Не удалось отправить email на ${to}: ${(e as Error).message}`);
    }
  }
}
