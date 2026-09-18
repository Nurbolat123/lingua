import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';
import { LearningPathService } from './learning-path.service';
import { LessonPlayerService } from './lesson-player.service';
import { VocabularyReviewService } from './vocabulary-review.service';

@Module({
  controllers: [LearningController],
  providers: [LearningPathService, LessonPlayerService, VocabularyReviewService],
})
export class LearningModule {}
