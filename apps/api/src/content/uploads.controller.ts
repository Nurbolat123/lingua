import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/auth.decorators';
import { PresignUploadDto } from './dto/uploads.dto';
import { UploadsService } from './uploads.service';

@ApiTags('admin-content')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/content/uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('presign')
  presign(@Body() dto: PresignUploadDto) {
    return this.uploads.presign(dto);
  }
}
