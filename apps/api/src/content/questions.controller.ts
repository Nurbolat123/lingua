import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/auth.decorators';
import { CreateQuestionDto, ImportQuestionsDto, ListQuestionsQueryDto, QuestionIdParamDto, UpdateQuestionDto } from './dto/questions.dto';
import { QuestionsService } from './questions.service';

@ApiTags('admin-content')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/content/questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  list(@Query() query: ListQuestionsQueryDto) {
    return this.questions.list(query);
  }

  @Post()
  create(@Body() dto: CreateQuestionDto) {
    return this.questions.create(dto);
  }

  @Post('import')
  importCsv(@Body() dto: ImportQuestionsDto) {
    return this.questions.importCsv(dto);
  }

  @Patch(':id')
  update(@Param() { id }: QuestionIdParamDto, @Body() dto: UpdateQuestionDto) {
    return this.questions.update(id, dto);
  }

  @Delete(':id')
  delete(@Param() { id }: QuestionIdParamDto) {
    return this.questions.delete(id);
  }
}
