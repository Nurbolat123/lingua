import { User, users } from '../db/schema';

/** Колонки пользователя, безопасные для отдачи в API */
export const publicUserColumns = {
  id: users.id,
  email: users.email,
  phone: users.phone,
  role: users.role,
  status: users.status,
  firstName: users.firstName,
  lastName: users.lastName,
  locale: users.locale,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};

export function toPublicUser(u: User) {
  const { passwordHash: _hash, updatedAt: _updated, ...rest } = u;
  return rest;
}
