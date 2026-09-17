import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, ReqMeta, RequestMeta, Roles } from '../common/auth.decorators';
import { AdminService } from './admin.service';
import { AssignCuratorDto, CreateStaffDto, ListUsersQueryDto, StudentIdParamDto, UpdateStatusDto, UserIdParamDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.admin.listUsers(query);
  }

  /** Создание кураторов и администраторов (публичная регистрация для них закрыта) */
  @Post('users')
  createStaff(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffDto, @ReqMeta() meta: RequestMeta) {
    return this.admin.createStaff(user.id, dto, meta.ip);
  }

  @Patch('users/:id/status')
  updateStatus(@CurrentUser() user: AuthUser, @Param() params: UserIdParamDto, @Body() dto: UpdateStatusDto, @ReqMeta() meta: RequestMeta) {
    return this.admin.updateStatus(user.id, params.id, dto.status, meta.ip);
  }

  @Post('curator-assignments')
  assign(@CurrentUser() user: AuthUser, @Body() dto: AssignCuratorDto, @ReqMeta() meta: RequestMeta) {
    return this.admin.assignCurator(user.id, dto, meta.ip);
  }

  @Delete('curator-assignments/:studentId')
  unassign(@CurrentUser() user: AuthUser, @Param() params: StudentIdParamDto, @ReqMeta() meta: RequestMeta) {
    return this.admin.unassignCurator(user.id, params.studentId, meta.ip);
  }
}
