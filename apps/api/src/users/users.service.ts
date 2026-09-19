import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { AuthUser } from '../common/auth.decorators';
import { buildEnglishProfile } from '../common/levels';
import { definedOnly } from '../common/utils';
import { ConsentsService } from '../consents/consents.service';
import { DB, Database } from '../db/db.module';
import { consents, ConsentType, studentProfiles, users } from '../db/schema';
import { UpdateMeDto } from './dto/users.dto';
import { toPublicUser } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly consentsService: ConsentsService,
  ) {}

  async me(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        studentProfile: {
          columns: {
            birthDate: true, isMinor: true, targetLevel: true, goal: true, dailyMinutes: true,
            grammarScore: true, vocabularyScore: true, readingScore: true, listeningScore: true, speakingScore: true,
          },
        },
        consents: { where: isNull(consents.revokedAt), columns: { type: true, version: true, grantedAt: true } },
      },
    });
    if (!user) throw new NotFoundException();
    const { studentProfile, consents: activeConsents, ...rest } = user;
    const englishProfile = studentProfile
      ? buildEnglishProfile({
          GRAMMAR: studentProfile.grammarScore,
          VOCABULARY: studentProfile.vocabularyScore,
          READING: studentProfile.readingScore,
          LISTENING: studentProfile.listeningScore,
          SPEAKING: studentProfile.speakingScore,
        })
      : null;
    return {
      ...toPublicUser(rest as typeof user),
      studentProfile: studentProfile ?? null,
      englishProfile,
      activeConsents,
      requiresParentConsent: user.status === 'PENDING_CONSENT',
    };
  }

  async updateMe(actor: AuthUser, dto: UpdateMeDto) {
    const { targetLevel, goal, dailyMinutes, ...rest } = dto;
    const userFields = definedOnly(rest);
    const studentFields = definedOnly({ targetLevel, goal, dailyMinutes });
    const hasStudentFields = Object.keys(studentFields).length > 0;
    if (hasStudentFields && actor.role !== 'STUDENT') {
      throw new BadRequestException('targetLevel, goal and dailyMinutes are available for students only');
    }

    await this.db.transaction(async (tx) => {
      if (Object.keys(userFields).length) {
        await tx.update(users).set(userFields).where(eq(users.id, actor.id));
      }
      if (hasStudentFields) {
        await tx.update(studentProfiles).set(studentFields).where(eq(studentProfiles.userId, actor.id));
      }
    });
    return this.me(actor.id);
  }

  consentHistory(userId: string) {
    return this.consentsService.history(userId);
  }

  async grantOwnConsent(actor: AuthUser, type: ConsentType, ip?: string) {
    await this.assertAdultSelf(actor);
    return this.consentsService.grant(actor.id, actor.id, type, ip);
  }

  async revokeOwnConsent(actor: AuthUser, type: ConsentType, ip?: string) {
    await this.assertAdultSelf(actor);
    if (type === 'DATA_PROCESSING') {
      // Отзыв согласия на обработку ПД = удаление аккаунта; делается отдельным процессом
      throw new BadRequestException('To withdraw data processing consent, request account deletion');
    }
    return this.consentsService.revoke(actor.id, actor.id, type, ip);
  }

  private async assertAdultSelf(actor: AuthUser) {
    const profile = await this.db.query.studentProfiles.findFirst({
      where: and(eq(studentProfiles.userId, actor.id), eq(studentProfiles.isMinor, true)),
      columns: { userId: true },
    });
    if (profile) {
      throw new ForbiddenException({ code: 'PARENT_CONSENT_REQUIRED', message: 'Consents for minors are managed by a parent' });
    }
  }
}
