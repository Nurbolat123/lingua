import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AllowPending, AuthUser, CurrentUser, ReqMeta, RequestMeta, Roles } from '../common/auth.decorators';
import { HomeworkService } from '../homework/homework.service';
import { ChildConsentParamDto, ChildParamDto, LessonReportParamDto, LinkChildDto, StudentParamDto } from './dto/family.dto';
import { ConsentTypeDto } from '../consents/dto/consent.dto';
import { FamilyService } from './family.service';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(
    private readonly family: FamilyService,
    private readonly homework: HomeworkService,
  ) {}

  /** Ученик получает код и передаёт его родителю. Доступно до согласия родителя. */
  @Post('me/link-code')
  @Roles('STUDENT')
  @AllowPending()
  createLinkCode(@CurrentUser() user: AuthUser) {
    return this.family.createLinkCode(user.id);
  }

  /** Карточка ученика: сам ученик, его родитель, его куратор, админ */
  @Get(':id')
  summary(@CurrentUser() user: AuthUser, @Param() params: StudentParamDto) {
    return this.family.studentSummary(user, params.id);
  }

  /** История баллов по навыкам — для графика динамики. Доступ как у карточки ученика. */
  @Get(':id/skill-history')
  skillHistory(@CurrentUser() user: AuthUser, @Param() params: StudentParamDto) {
    return this.family.skillHistory(user, params.id);
  }

  /** Уроки (посещаемость, время) — для кабинета родителя */
  @Get(':id/lessons')
  lessons(@CurrentUser() user: AuthUser, @Param() params: StudentParamDto) {
    return this.family.listLessons(user, params.id);
  }

  /** Отчёт по конкретному уроку — как в уведомлении «Урок завершён» */
  @Get(':id/lessons/:lessonId/report')
  lessonReport(@CurrentUser() user: AuthUser, @Param() params: LessonReportParamDto) {
    return this.family.lessonReport(user, params.id, params.lessonId);
  }

  /** Недельная сводка — для кабинета родителя */
  @Get(':id/weekly-summary')
  weeklySummary(@CurrentUser() user: AuthUser, @Param() params: StudentParamDto) {
    return this.family.weeklySummary(user, params.id);
  }

  /** Домашние задания — для кабинета родителя (та же проверка доступа, что у HomeworkService) */
  @Get(':id/homework')
  homeworkList(@CurrentUser() user: AuthUser, @Param() params: StudentParamDto) {
    return this.homework.listForStudent(user, params.id);
  }
}

@ApiTags('parents')
@ApiBearerAuth()
@Roles('PARENT')
@Controller('parents/children')
export class ParentsController {
  constructor(private readonly family: FamilyService) {}

  @Post('link')
  link(@CurrentUser() user: AuthUser, @Body() dto: LinkChildDto, @ReqMeta() meta: RequestMeta) {
    return this.family.linkChild(user.id, dto.code, meta.ip);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.family.listChildren(user.id);
  }

  @Delete(':childId')
  unlink(@CurrentUser() user: AuthUser, @Param() params: ChildParamDto, @ReqMeta() meta: RequestMeta) {
    return this.family.unlinkChild(user.id, params.childId, meta.ip);
  }

  @Post(':childId/consents')
  grantConsent(
    @CurrentUser() user: AuthUser,
    @Param() params: ChildParamDto,
    @Body() dto: ConsentTypeDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.family.grantChildConsent(user, params.childId, dto.type, meta.ip);
  }

  @Delete(':childId/consents/:type')
  revokeConsent(@CurrentUser() user: AuthUser, @Param() params: ChildConsentParamDto, @ReqMeta() meta: RequestMeta) {
    return this.family.revokeChildConsent(user, params.childId, params.type, meta.ip);
  }
}
