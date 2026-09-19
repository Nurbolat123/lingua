import { Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, OptionalAuth } from '../common/auth.decorators';
import { AttemptIdParamDto, PresignSpeakingDto, SubmitAnswerDto, SubmitSpeakingDto } from './dto/placement.dto';
import { PlacementService } from './placement.service';
import { SpeakingStorageService } from '../common/speaking-storage.service';

@ApiTags('placement')
@ApiBearerAuth()
@OptionalAuth()
@Controller('placement/attempts')
export class PlacementController {
  constructor(
    private readonly placement: PlacementService,
    private readonly speakingStorage: SpeakingStorageService,
  ) {}

  @Post()
  start(@CurrentUser() actor: AuthUser | undefined) {
    return this.placement.startAttempt(actor);
  }

  @Get(':id')
  getState(@Param() { id }: AttemptIdParamDto, @CurrentUser() actor: AuthUser | undefined) {
    return this.placement.getState(id, actor);
  }

  @Get(':id/next-question')
  getNextQuestion(@Param() { id }: AttemptIdParamDto, @CurrentUser() actor: AuthUser | undefined) {
    return this.placement.getNextQuestion(id, actor);
  }

  @Post(':id/answers')
  submitAnswer(@Param() { id }: AttemptIdParamDto, @CurrentUser() actor: AuthUser | undefined, @Body() dto: SubmitAnswerDto) {
    return this.placement.submitAnswer(id, actor, dto);
  }

  // Путь включает :id попытки для единообразия API, хотя presign не привязан к конкретной попытке
  @Post(':id/speaking/presign')
  presignSpeaking(@CurrentUser() actor: AuthUser | undefined, @Body() dto: PresignSpeakingDto) {
    if (!actor) throw new ForbiddenException('Speaking requires an account');
    return this.speakingStorage.presign(dto, actor.id);
  }

  @Post(':id/speaking')
  submitSpeaking(@Param() { id }: AttemptIdParamDto, @CurrentUser() actor: AuthUser | undefined, @Body() dto: SubmitSpeakingDto) {
    return this.placement.submitSpeaking(id, actor, dto);
  }

  @Post(':id/claim')
  claim(@Param() { id }: AttemptIdParamDto, @CurrentUser() actor: AuthUser | undefined) {
    if (!actor) throw new ForbiddenException('Login required');
    return this.placement.claimAttempt(id, actor);
  }
}
