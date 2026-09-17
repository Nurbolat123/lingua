import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { Role, UserStatus } from '../db/schema';

export interface AuthUser {
  id: string;
  role: Role;
  status: UserStatus;
}

export const IS_PUBLIC = 'auth:public';
/** Эндпоинт доступен без токена */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ALLOW_PENDING = 'auth:allowPending';
/** Доступно аккаунту, который ждёт согласия родителя */
export const AllowPending = () => SetMetadata(ALLOW_PENDING, true);

export const ROLES = 'auth:roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<Request & { user: AuthUser }>().user,
);

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

export const ReqMeta = createParamDecorator((_: unknown, ctx: ExecutionContext): RequestMeta => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return { ip: req.ip, userAgent: req.headers['user-agent']?.slice(0, 255) };
});
