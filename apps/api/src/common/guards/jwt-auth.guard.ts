import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import { DB, Database } from '../../db/db.module';
import { users } from '../../db/schema';
import { ALLOW_PENDING, AuthUser, IS_PUBLIC, OPTIONAL_AUTH } from '../auth.decorators';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(DB) private readonly db: Database,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = ctx.switchToHttp().getRequest();
    const optional = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH, targets);
    const [scheme, token] = String(req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      if (optional) return true;
      throw new UnauthorizedException();
    }

    let sub: string;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: string }>(token));
    } catch {
      if (optional) return true;
      throw new UnauthorizedException();
    }

    // Статус читается из БД на каждый запрос: блокировка и согласие родителя
    // действуют сразу, а не после истечения токена. Позже можно кэшировать в Redis.
    const user: AuthUser | undefined = await this.db.query.users.findFirst({
      where: eq(users.id, sub),
      columns: { id: true, role: true, status: true },
    });
    if (!user || user.status === 'BLOCKED') {
      if (optional) return true;
      throw new UnauthorizedException();
    }

    if (
      user.status === 'PENDING_CONSENT' &&
      !optional &&
      !this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING, targets)
    ) {
      throw new ForbiddenException({ code: 'PARENT_CONSENT_REQUIRED', message: 'Parent consent is required' });
    }

    req.user = user;
    return true;
  }
}
