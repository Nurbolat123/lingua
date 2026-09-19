import { Global, Module } from '@nestjs/common';
import { AccessService } from './access.service';
import { AuditService } from './audit.service';
import { SpeakingStorageService } from './speaking-storage.service';

@Global()
@Module({
  providers: [AuditService, AccessService, SpeakingStorageService],
  exports: [AuditService, AccessService, SpeakingStorageService],
})
export class CommonModule {}
