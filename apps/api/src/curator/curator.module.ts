import { Controller, Get, Inject, Injectable, Module } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { and, desc, eq } from 'drizzle-orm';
import { AuthUser, CurrentUser, Roles } from '../common/auth.decorators';
import { DB, Database } from '../db/db.module';
import { curatorStudents } from '../db/schema';

@Injectable()
export class CuratorService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async myStudents(curatorId: string) {
    const rows = await this.db.query.curatorStudents.findMany({
      where: and(eq(curatorStudents.curatorId, curatorId), eq(curatorStudents.active, true)),
      columns: { assignedAt: true },
      orderBy: desc(curatorStudents.assignedAt),
      with: {
        student: {
          columns: { id: true, firstName: true, lastName: true, status: true, lastLoginAt: true },
          with: { studentProfile: { columns: { isMinor: true, targetLevel: true, dailyMinutes: true } } },
        },
      },
    });
    // На следующих этапах сюда добавятся уровень, последняя активность и ДЗ на проверке
    return rows.map(({ student, assignedAt }) => ({ ...student, assignedAt }));
  }
}

@ApiTags('curator')
@ApiBearerAuth()
@Roles('CURATOR')
@Controller('curator')
export class CuratorController {
  constructor(private readonly curator: CuratorService) {}

  @Get('students')
  students(@CurrentUser() user: AuthUser) {
    return this.curator.myStudents(user.id);
  }
}

@Module({ controllers: [CuratorController], providers: [CuratorService] })
export class CuratorModule {}
