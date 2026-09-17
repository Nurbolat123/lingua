import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { AuditService } from '../common/audit.service';
import { RequestMeta } from '../common/auth.decorators';
import { ADULT_AGE, ageInYears, isUniqueViolation, MIN_STUDENT_AGE, normalizeEmail } from '../common/utils';
import { Env } from '../config/env';
import { DB, Database } from '../db/db.module';
import { consents, studentProfiles, users } from '../db/schema';
import { toPublicUser } from '../users/user.mapper';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  // Проверка пароля против фиктивного хеша, чтобы время ответа
  // не выдавало, существует ли email
  private readonly dummyHash = argon2.hash('timing-equalizer-password');

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta) {
    const email = normalizeEmail(dto.email);
    let isMinor = false;

    if (dto.role === 'STUDENT') {
      const age = ageInYears(dto.birthDate!);
      if (age < MIN_STUDENT_AGE || age > 100) throw new BadRequestException('Invalid birth date');
      isMinor = age < ADULT_AGE;
    }

    const passwordHash = await argon2.hash(dto.password);
    const consentVersion = this.config.get('CONSENT_VERSION', { infer: true });

    let user;
    try {
      user = await this.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({
            email,
            passwordHash,
            role: dto.role,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName?.trim() || null,
            locale: dto.locale ?? 'ru',
            // Несовершеннолетний не может сам дать согласие на обработку ПД
            status: isMinor ? 'PENDING_CONSENT' : 'ACTIVE',
          })
          .returning();

        if (dto.role === 'STUDENT') {
          await tx.insert(studentProfiles).values({ userId: created.id, birthDate: dto.birthDate!, isMinor });
        }
        if (!isMinor) {
          await tx.insert(consents).values({
            subjectId: created.id,
            grantedById: created.id,
            type: 'DATA_PROCESSING',
            version: consentVersion,
          });
        }
        return created;
      });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('Email already registered');
      throw e;
    }

    await this.audit.log({
      actorId: user.id, action: 'auth.register', entity: 'user', entityId: user.id,
      meta: { role: user.role, isMinor }, ip: meta.ip,
    });

    const { tokens } = await this.tokens.issue(user, meta);
    return { user: toPublicUser(user), requiresParentConsent: isMinor, ...tokens };
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const user = await this.db.query.users.findFirst({ where: eq(users.email, normalizeEmail(dto.email)) });

    const passwordOk = user
      ? await argon2.verify(user.passwordHash, dto.password)
      : (await argon2.verify(await this.dummyHash, dto.password), false);

    if (!user || !passwordOk) {
      await this.audit.log({ actorId: user?.id, action: 'auth.login_failed', entity: 'user', entityId: user?.id, ip: meta.ip });
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status === 'BLOCKED') throw new ForbiddenException('Account is blocked');

    await this.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await this.audit.log({ actorId: user.id, action: 'auth.login', entity: 'user', entityId: user.id, ip: meta.ip });

    const { tokens } = await this.tokens.issue(user, meta);
    return { user: toPublicUser(user), requiresParentConsent: user.status === 'PENDING_CONSENT', ...tokens };
  }

  refresh(dto: RefreshDto, meta: RequestMeta) {
    return this.tokens.rotate(dto.refreshToken, meta);
  }

  async logout(dto: RefreshDto) {
    await this.tokens.revoke(dto.refreshToken);
    return { ok: true };
  }
}
