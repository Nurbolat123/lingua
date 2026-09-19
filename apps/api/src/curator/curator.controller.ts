import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/auth.decorators';
import { AssignHomeworkDto, HomeworkIdParamDto, ReviewHomeworkDto } from '../homework/dto/homework.dto';
import { HomeworkService } from '../homework/homework.service';
import { CuratorStudentsService } from './curator-students.service';
import {
  LessonAnswerIdParamDto, PlacementAttemptIdParamDto, ReviewSpeakingDto, StudentIdParamDto, StudentListQueryDto,
  UpdateStudentPlanDto,
} from './dto/curator.dto';
import { SpeakingReviewService } from './speaking-review.service';

@ApiTags('curator')
@ApiBearerAuth()
@Roles('CURATOR')
@Controller('curator')
export class CuratorController {
  constructor(
    private readonly students: CuratorStudentsService,
    private readonly speakingReview: SpeakingReviewService,
    private readonly homework: HomeworkService,
  ) {}

  @Get('students')
  myStudents(@CurrentUser() user: AuthUser, @Query() query: StudentListQueryDto) {
    return this.students.myStudents(user.id, {
      inactiveDays: query.inactiveDays ? Number(query.inactiveDays) : undefined,
      lowScore: query.lowScore === 'true',
      hasPending: query.hasPending === 'true',
    });
  }

  @Get('students/:id')
  studentCard(@CurrentUser() user: AuthUser, @Param() params: StudentIdParamDto) {
    return this.students.studentCard(user, params.id);
  }

  @Get('students/:id/mistakes')
  mistakes(@CurrentUser() user: AuthUser, @Param() params: StudentIdParamDto) {
    return this.students.recentMistakes(user, params.id);
  }

  @Get('students/:id/speaking-recordings')
  recordings(@CurrentUser() user: AuthUser, @Param() params: StudentIdParamDto) {
    return this.students.speakingRecordings(user, params.id);
  }

  @Get('students/:id/homework')
  studentHomework(@CurrentUser() user: AuthUser, @Param() params: StudentIdParamDto) {
    return this.homework.listForStudent(user, params.id);
  }

  @Patch('students/:id/plan')
  updatePlan(@CurrentUser() user: AuthUser, @Param() params: StudentIdParamDto, @Body() dto: UpdateStudentPlanDto) {
    return this.students.updatePlan(user, params.id, dto);
  }

  @Post('homework')
  assignHomework(@CurrentUser() user: AuthUser, @Body() dto: AssignHomeworkDto) {
    return this.homework.assign(user, dto);
  }

  @Post('homework/:id/review')
  reviewHomework(@CurrentUser() user: AuthUser, @Param() params: HomeworkIdParamDto, @Body() dto: ReviewHomeworkDto) {
    return this.homework.review(user, params.id, dto);
  }

  @Get('homework/:id/listen')
  listenHomework(@CurrentUser() user: AuthUser, @Param() params: HomeworkIdParamDto) {
    return this.homework.getListenUrl(user, params.id);
  }

  @Get('review-queue')
  reviewQueue(@CurrentUser() user: AuthUser) {
    return this.speakingReview.reviewQueue(user.id);
  }

  @Get('placement-attempts/:id/recordings')
  placementRecordings(@CurrentUser() user: AuthUser, @Param() params: PlacementAttemptIdParamDto) {
    return this.speakingReview.getPlacementRecordings(user, params.id);
  }

  @Post('placement-attempts/:id/review-speaking')
  reviewPlacementSpeaking(@CurrentUser() user: AuthUser, @Param() params: PlacementAttemptIdParamDto, @Body() dto: ReviewSpeakingDto) {
    return this.speakingReview.reviewPlacementSpeaking(user, params.id, dto);
  }

  @Get('lesson-answers/:id/recording')
  lessonRecording(@CurrentUser() user: AuthUser, @Param() params: LessonAnswerIdParamDto) {
    return this.speakingReview.getLessonRecording(user, params.id);
  }

  @Post('lesson-answers/:id/review-speaking')
  reviewLessonSpeaking(@CurrentUser() user: AuthUser, @Param() params: LessonAnswerIdParamDto, @Body() dto: ReviewSpeakingDto) {
    return this.speakingReview.reviewLessonSpeaking(user, params.id, dto);
  }
}
