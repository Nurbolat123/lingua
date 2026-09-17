import { Global, Module } from '@nestjs/common';
import { AccessService } from './access.service';
import { AuditService } from './audit.service';

@Global()
@Module({ providers: [AuditService, AccessService], exports: [AuditService, AccessService] })
export class CommonModule {}
