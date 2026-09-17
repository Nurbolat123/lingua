import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, Database } from '../db/db.module';
import { curatorStudents, parentChildLinks } from '../db/schema';
import { AuthUser } from './auth.decorators';

/**
 * Проверка доступа к данным конкретного ученика.
 * Роли недостаточно: куратор видит только своих учеников, родитель только своих детей.
 * Все будущие модули (прогресс, ДЗ, записи speaking) используют этот сервис.
 */
@Injectable()
export class AccessService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async canViewStudent(actor: AuthUser, studentId: string): Promise<boolean> {
    switch (actor.role) {
      case 'ADMIN':
        return true;
      case 'STUDENT':
        return actor.id === studentId;
      case 'PARENT':
        return (
          (await this.db.$count(
            parentChildLinks,
            and(eq(parentChildLinks.parentId, actor.id), eq(parentChildLinks.childId, studentId), eq(parentChildLinks.status, 'ACTIVE')),
          )) > 0
        );
      case 'CURATOR':
        return (
          (await this.db.$count(
            curatorStudents,
            and(eq(curatorStudents.curatorId, actor.id), eq(curatorStudents.studentId, studentId), eq(curatorStudents.active, true)),
          )) > 0
        );
      default:
        return false;
    }
  }

  /** 404 вместо 403, чтобы не раскрывать существование ученика */
  async assertCanViewStudent(actor: AuthUser, studentId: string): Promise<void> {
    if (!(await this.canViewStudent(actor, studentId))) throw new NotFoundException('Student not found');
  }
}
