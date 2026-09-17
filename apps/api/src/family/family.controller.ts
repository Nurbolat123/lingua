import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AllowPending, AuthUser, CurrentUser, ReqMeta, RequestMeta, Roles } from '../common/auth.decorators';
import { ChildConsentParamDto, ChildParamDto, LinkChildDto, StudentParamDto } from './dto/family.dto';
import { ConsentTypeDto } from '../consents/dto/consent.dto';
import { FamilyService } from './family.service';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly family: FamilyService) {}

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
