import { Global, Module } from '@nestjs/common';
import { SkillRecalcService } from './skill-recalc.service';

/** Глобальный модуль: пересчёт навыков нужен в learning, homework и curator — без циклических импортов. */
@Global()
@Module({
  providers: [SkillRecalcService],
  exports: [SkillRecalcService],
})
export class SkillRecalcModule {}
