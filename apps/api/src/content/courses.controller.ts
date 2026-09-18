import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/auth.decorators';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto, CreateExerciseDto, CreateLessonBlockDto, CreateLessonDto, CreateModuleDto,
  IdParamDto, ListCoursesQueryDto, UpdateCourseDto, UpdateExerciseDto, UpdateLessonBlockDto,
  UpdateLessonDto, UpdateModuleDto,
} from './dto/courses.dto';

@ApiTags('admin-content')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/content')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get('courses')
  listCourses(@Query() query: ListCoursesQueryDto) {
    return this.courses.listCourses(query);
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.courses.createCourse(dto);
  }

  @Get('courses/:id')
  getCourse(@Param() { id }: IdParamDto) {
    return this.courses.getCourse(id);
  }

  @Patch('courses/:id')
  updateCourse(@Param() { id }: IdParamDto, @Body() dto: UpdateCourseDto) {
    return this.courses.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  deleteCourse(@Param() { id }: IdParamDto) {
    return this.courses.deleteCourse(id);
  }

  @Post('courses/:id/modules')
  createModule(@Param() { id }: IdParamDto, @Body() dto: CreateModuleDto) {
    return this.courses.createModule(id, dto);
  }

  @Patch('modules/:id')
  updateModule(@Param() { id }: IdParamDto, @Body() dto: UpdateModuleDto) {
    return this.courses.updateModule(id, dto);
  }

  @Delete('modules/:id')
  deleteModule(@Param() { id }: IdParamDto) {
    return this.courses.deleteModule(id);
  }

  @Post('modules/:id/lessons')
  createLesson(@Param() { id }: IdParamDto, @Body() dto: CreateLessonDto) {
    return this.courses.createLesson(id, dto);
  }

  @Get('lessons/:id')
  getLesson(@Param() { id }: IdParamDto) {
    return this.courses.getLesson(id);
  }

  @Get('lessons/:id/preview')
  previewLesson(@Param() { id }: IdParamDto) {
    return this.courses.previewLesson(id);
  }

  @Patch('lessons/:id')
  updateLesson(@Param() { id }: IdParamDto, @Body() dto: UpdateLessonDto) {
    return this.courses.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param() { id }: IdParamDto) {
    return this.courses.deleteLesson(id);
  }

  @Post('lessons/:id/blocks')
  createBlock(@Param() { id }: IdParamDto, @Body() dto: CreateLessonBlockDto) {
    return this.courses.createBlock(id, dto);
  }

  @Patch('blocks/:id')
  updateBlock(@Param() { id }: IdParamDto, @Body() dto: UpdateLessonBlockDto) {
    return this.courses.updateBlock(id, dto);
  }

  @Delete('blocks/:id')
  deleteBlock(@Param() { id }: IdParamDto) {
    return this.courses.deleteBlock(id);
  }

  @Post('blocks/:id/exercises')
  createExercise(@Param() { id }: IdParamDto, @Body() dto: CreateExerciseDto) {
    return this.courses.createExercise(id, dto);
  }

  @Patch('exercises/:id')
  updateExercise(@Param() { id }: IdParamDto, @Body() dto: UpdateExerciseDto) {
    return this.courses.updateExercise(id, dto);
  }

  @Delete('exercises/:id')
  deleteExercise(@Param() { id }: IdParamDto) {
    return this.courses.deleteExercise(id);
  }
}
