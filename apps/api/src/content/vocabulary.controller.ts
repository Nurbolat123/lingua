import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/auth.decorators';
import {
  CreateVocabularyDto, ImportVocabularyDto, ListVocabularyQueryDto, UpdateVocabularyDto, VocabularyIdParamDto,
} from './dto/vocabulary.dto';
import { VocabularyService } from './vocabulary.service';

@ApiTags('admin-content')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/content/vocabulary')
export class VocabularyController {
  constructor(private readonly vocabulary: VocabularyService) {}

  @Get()
  list(@Query() query: ListVocabularyQueryDto) {
    return this.vocabulary.list(query);
  }

  @Post()
  create(@Body() dto: CreateVocabularyDto) {
    return this.vocabulary.create(dto);
  }

  @Post('import')
  importCsv(@Body() dto: ImportVocabularyDto) {
    return this.vocabulary.importCsv(dto);
  }

  @Patch(':id')
  update(@Param() { id }: VocabularyIdParamDto, @Body() dto: UpdateVocabularyDto) {
    return this.vocabulary.update(id, dto);
  }

  @Delete(':id')
  delete(@Param() { id }: VocabularyIdParamDto) {
    return this.vocabulary.delete(id);
  }
}
