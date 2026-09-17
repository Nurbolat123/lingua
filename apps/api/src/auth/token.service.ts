import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { and, eq, isNull } from 'drizzle-orm';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { RequestMeta } from '../common/auth.decorators';
import { Env } from '../config/env';
import { DB, Database } from '../db/db.module';
import { refreshTokens, Role, users } from '../db/schema';

const sha256 = (v: string) => createHash('sha256').update(v).digest();

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

/**
 * Refresh-токены: формат "<id>.<secret>", в БД хранится только sha256(secret).
 * Каждое обновление выдаёт новый токен (ротация). Повторное использование
 * старого токена означает кражу, поэтому отзывается вся сессия (family).
 */
@Injectable()
export class TokenService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async issue(user: { id: string; role: Role }, meta: RequestMeta, familyId: string = randomUUID()) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    const secret = randomBytes(48).toString('base64url');
    const ttlDays = Number(this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }));

    const [row] = await this.db
      .insert(refreshTokens)
      .values({
        userId: user.id,
        familyId,
        tokenHash: sha256(secret).toString('hex'),
        expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
        ip: meta.ip,
        userAgent: meta.userAgent,
      })
      .returning({ id: refreshTokens.id });

    const tokens: TokenPair = {
      accessToken,
      refreshToken: `${row.id}.${secret}`,
      tokenType: 'Bearer',
      expiresIn: Number(this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true })),
    };
    return { recordId: row.id, tokens };
  }

  async rotate(raw: string, meta: RequestMeta): Promise<TokenPair> {
    const record = await this.find(raw);
    const now = new Date();
    if (record.expiresAt <= now) throw new UnauthorizedException('Refresh token expired');

    // Атомарно "забираем" токен: при гонке или повторе обновится 0 строк
    const [claimed] = await this.db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(and(eq(refreshTokens.id, record.id), isNull(refreshTokens.revokedAt)))
      .returning({ id: refreshTokens.id });

    if (!claimed) {
      await this.revokeFamily(record.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, record.userId),
      columns: { id: true, role: true, status: true },
    });
    if (!user || user.status === 'BLOCKED') throw new UnauthorizedException();

    const issued = await this.issue(user, meta, record.familyId);
    await this.db.update(refreshTokens).set({ replacedById: issued.recordId }).where(eq(refreshTokens.id, record.id));
    return issued.tokens;
  }

  async revoke(raw: string): Promise<void> {
    const record = await this.find(raw).catch(() => null);
    if (record) await this.revokeFamily(record.familyId);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }

  private async revokeFamily(familyId: string) {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)));
  }

  private async find(raw: string) {
    const [id, secret] = raw.split('.');
    if (!id || !secret || !isUUID(id)) throw new UnauthorizedException('Invalid refresh token');
    const record = await this.db.query.refreshTokens.findFirst({ where: eq(refreshTokens.id, id) });
    if (!record) throw new UnauthorizedException('Invalid refresh token');
    const expected = Buffer.from(record.tokenHash, 'hex');
    const actual = sha256(secret);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return record;
  }
}
