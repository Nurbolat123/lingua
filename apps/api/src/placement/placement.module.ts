import { Module } from '@nestjs/common';
import { PlacementController } from './placement.controller';
import { PlacementService } from './placement.service';
import { SpeakingStorageService } from './speaking-storage.service';

@Module({
  controllers: [PlacementController],
  providers: [PlacementService, SpeakingStorageService],
})
export class PlacementModule {}
