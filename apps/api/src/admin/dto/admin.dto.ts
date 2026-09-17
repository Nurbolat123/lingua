import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Role, roleEnum, UserStatus, userStatusEnum } from '../../db/schema';

export class ListUsersQueryDto {
  @IsOptional() @IsIn(roleEnum.enumValues)
  role?: Role;

  @IsOptional() @IsIn(userStatusEnum.enumValues)
  status?: UserStatus;

  @IsOptional() @IsString() @MaxLength(100)
  search?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize: number = 20;
}

export class CreateStaffDto {
  @IsEmail() @MaxLength(254)
  email: string;

  @IsString() @MinLength(12) @MaxLength(72)
  password: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  firstName: string;

  @IsOptional() @IsString() @MaxLength(80)
  lastName?: string;

  @IsIn(['CURATOR', 'ADMIN'])
  role: 'CURATOR' | 'ADMIN';
}

export class UpdateStatusDto {
  @IsIn(['ACTIVE', 'BLOCKED'])
  status: 'ACTIVE' | 'BLOCKED';
}

export class UserIdParamDto {
  @IsUUID()
  id: string;
}

export class AssignCuratorDto {
  @IsUUID()
  curatorId: string;

  @IsUUID()
  studentId: string;
}

export class StudentIdParamDto {
  @IsUUID()
  studentId: string;
}
