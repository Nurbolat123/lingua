import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AllowPending, AuthUser, CurrentUser, ReqMeta, RequestMeta } from '../common/auth.decorators';
import { ConsentTypeDto } from '../consents/dto/consent.dto';
import { UpdateMeDto } from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @AllowPending()
  me(@CurrentUser() user: AuthUser) {
    return this.users.me(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user, dto);
  }

  @Get('consents')
  @AllowPending()
  consents(@CurrentUser() user: AuthUser) {
    return this.users.consentHistory(user.id);
  }

  @Post('consents')
  grant(@CurrentUser() user: AuthUser, @Body() dto: ConsentTypeDto, @ReqMeta() meta: RequestMeta) {
    return this.users.grantOwnConsent(user, dto.type, meta.ip);
  }

  @Delete('consents/:type')
  revoke(@CurrentUser() user: AuthUser, @Param() params: ConsentTypeDto, @ReqMeta() meta: RequestMeta) {
    return this.users.revokeOwnConsent(user, params.type, meta.ip);
  }
}
