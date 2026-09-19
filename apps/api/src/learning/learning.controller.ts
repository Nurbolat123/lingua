import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/auth.decorators';
import { SpeakingStorageService } from '../common/speaking-storage.service';
import { PresignSpeakingDto } from '../common/dto/presign-speaking.dto';
import {
  HeartbeatDto, LessonBlockParamDto, LessonExerciseParamDto, LessonIdParamDto, PracticeQuestionIdParamDto,
  ReviewVocabularyDto, StudentVocabularyIdParamDto, SubmitLessonAnswerDto, SubmitLessonSpeakingDto,
  SubmitPracticeAnswerDto,
} from './dto/learning.dto';
import { LearningPathService } from './learning-path.service';
import { LessonPlayerService } from './lesson-player.service';
import { VocabularyReviewService } from './vocabulary-review.service';

@ApiTags('learning')
@ApiBearerAuth()
@Roles('STUDENT')
@Controller('learning')
export class LearningController {
  constructor(
    private readonly path: LearningPathService,
    private readonly player: LessonPlayerService,
    private readonly vocabulary: VocabularyReviewService,
    private readonly speakingStorage: SpeakingStorageService,
  ) {}

  @Get('today-plan')
  todayPlan(@CurrentUser() actor: AuthUser) {
    return this.path.getTodayPlan(actor.id);
  }

  @Post('practice/:questionId/answers')
  submitPractice(@CurrentUser() actor: AuthUser, @Param() { questionId }: PracticeQuestionIdParamDto, @Body() dto: SubmitPracticeAnswerDto) {
    return this.path.submitPracticeAnswer(actor.id, questionId, dto.answer);
  }

  @Get('lessons/:id')
  getLesson(@CurrentUser() actor: AuthUser, @Param() { id }: LessonIdParamDto) {
    return this.player.getLesson(actor.id, id);
  }

  @Post('lessons/:id/exercises/:exerciseId/answers')
  submitAnswer(@CurrentUser() actor: AuthUser, @Param() { id, exerciseId }: LessonExerciseParamDto, @Body() dto: SubmitLessonAnswerDto) {
    return this.player.submitAnswer(actor.id, id, exerciseId, dto);
  }

  @Post('lessons/:id/exercises/:exerciseId/speaking-presign')
  presignSpeaking(@CurrentUser() actor: AuthUser, @Body() dto: PresignSpeakingDto) {
    return this.speakingStorage.presign(dto, actor.id);
  }

  @Post('lessons/:id/exercises/:exerciseId/speaking')
  submitSpeaking(@CurrentUser() actor: AuthUser, @Param() { id, exerciseId }: LessonExerciseParamDto, @Body() dto: SubmitLessonSpeakingDto) {
    return this.player.submitSpeaking(actor.id, id, exerciseId, dto);
  }

  @Post('lessons/:id/blocks/:blockId/complete')
  completeBlock(@CurrentUser() actor: AuthUser, @Param() { id, blockId }: LessonBlockParamDto) {
    return this.player.completeBlock(actor.id, id, blockId);
  }

  @Post('lessons/:id/heartbeat')
  heartbeat(@CurrentUser() actor: AuthUser, @Param() { id }: LessonIdParamDto, @Body() dto: HeartbeatDto) {
    return this.player.heartbeat(actor.id, id, dto.seconds);
  }

  @Get('vocabulary/due')
  dueVocabulary(@CurrentUser() actor: AuthUser) {
    return this.vocabulary.due(actor.id);
  }

  @Post('vocabulary/:id/review')
  reviewVocabulary(@CurrentUser() actor: AuthUser, @Param() { id }: StudentVocabularyIdParamDto, @Body() dto: ReviewVocabularyDto) {
    return this.vocabulary.review(actor.id, id, dto);
  }
}
