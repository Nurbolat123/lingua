import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

@Module({
  controllers: [CoursesController, VocabularyController, QuestionsController, UploadsController],
  providers: [CoursesService, VocabularyService, QuestionsService, UploadsService],
})
export class ContentModule {}
