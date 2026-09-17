import { Inject, Injectable, Logger } from '@nestjs/common';
import { DB, Database } from '../db/db.module';
import { auditLogs } from '../db/schema';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(@Inject(DB) private readonly db: Database) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.db.insert(auditLogs).values(entry);
    } catch (e) {
      // Сбой аудита не должен ломать бизнес-операцию, но должен быть виден в логах
      this.logger.error(`Audit write failed: ${entry.action}`, e as Error);
    }
  }
}
