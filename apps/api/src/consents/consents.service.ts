import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { AuditService } from '../common/audit.service';
import { Env } from '../config/env';
import { DB, Database } from '../db/db.module';
import { consents, ConsentType, users } from '../db/schema';

@Injectable()
export class ConsentsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly audit: AuditService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  history(subjectId: string) {
    return this.db.query.consents.findMany({
      where: eq(consents.subjectId, subjectId),
      columns: { id: true, type: true, version: true, grantedById: true, grantedAt: true, revokedAt: true },
      orderBy: desc(consents.grantedAt),
    });
  }

  /**
   * Выдать согласие. Если действующее согласие на старую версию документа,
   * оно закрывается и создаётся новое. Согласие на обработку ПД активирует
   * аккаунт несовершеннолетнего.
   */
  async grant(subjectId: string, grantedById: string, type: ConsentType, ip?: string) {
    const version = this.config.get('CONSENT_VERSION', { infer: true });
    const existing = await this.db.query.consents.findFirst({
      where: and(eq(consents.subjectId, subjectId), eq(consents.type, type), isNull(consents.revokedAt)),
    });
    if (existing?.version === version) return existing;

    const created = await this.db.transaction(async (tx) => {
      if (existing) {
        await tx.update(consents).set({ revokedAt: new Date() }).where(eq(consents.id, existing.id));
      }
      const [row] = await tx.insert(consents).values({ subjectId, grantedById, type, version }).returning();
      if (type === 'DATA_PROCESSING') {
        await tx
          .update(users)
          .set({ status: 'ACTIVE' })
          .where(and(eq(users.id, subjectId), eq(users.status, 'PENDING_CONSENT')));
      }
      return row;
    });

    await this.audit.log({
      actorId: grantedById, action: 'consent.grant', entity: 'user', entityId: subjectId, meta: { type, version }, ip,
    });
    return created;
  }

  async revoke(subjectId: string, actorId: string, type: ConsentType, ip?: string) {
    const revoked = await this.db.transaction(async (tx) => {
      const rows = await tx
        .update(consents)
        .set({ revokedAt: new Date() })
        .where(and(eq(consents.subjectId, subjectId), eq(consents.type, type), isNull(consents.revokedAt)))
        .returning({ id: consents.id });
      if (rows.length && type === 'DATA_PROCESSING') {
        await tx
          .update(users)
          .set({ status: 'PENDING_CONSENT' })
          .where(and(eq(users.id, subjectId), eq(users.status, 'ACTIVE')));
      }
      return rows.length > 0;
    });

    if (revoked) {
      await this.audit.log({ actorId, action: 'consent.revoke', entity: 'user', entityId: subjectId, meta: { type }, ip });
    }
    return { revoked };
  }
}
