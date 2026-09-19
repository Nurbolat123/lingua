import { Module } from '@nestjs/common';
import { HomeworkModule } from '../homework/homework.module';
import { CuratorController } from './curator.controller';
import { CuratorStudentsService } from './curator-students.service';
import { SpeakingReviewService } from './speaking-review.service';

@Module({
  imports: [HomeworkModule],
  controllers: [CuratorController],
  providers: [CuratorStudentsService, SpeakingReviewService],
})
export class CuratorModule {}
