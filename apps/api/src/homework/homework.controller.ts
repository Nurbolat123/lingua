import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/auth.decorators';
import { PresignSpeakingDto } from '../common/dto/presign-speaking.dto';
import { HomeworkIdParamDto, SubmitHomeworkDto } from './dto/homework.dto';
import { HomeworkService } from './homework.service';

@ApiTags('homework')
@ApiBearerAuth()
@Roles('STUDENT')
@Controller('learning/homework')
export class HomeworkController {
  constructor(private readonly homework: HomeworkService) {}

  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.homework.listMine(user.id);
  }

  @Post(':id/speaking-presign')
  presign(@CurrentUser() user: AuthUser, @Param() params: HomeworkIdParamDto, @Body() dto: PresignSpeakingDto) {
    return this.homework.presignAudio(user.id, params.id, dto);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: AuthUser, @Param() params: HomeworkIdParamDto, @Body() dto: SubmitHomeworkDto) {
    return this.homework.submit(user.id, params.id, dto);
  }
}
