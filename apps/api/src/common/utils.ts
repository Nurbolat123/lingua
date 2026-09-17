export const ADULT_AGE = 18;
export const MIN_STUDENT_AGE = 6;

/** Полных лет на дату now. isoDate: YYYY-MM-DD */
export function ageInYears(isoDate: string, now = new Date()): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const month = now.getUTCMonth() + 1;
  let age = now.getUTCFullYear() - y;
  if (month < m || (month === m && now.getUTCDate() < d)) age--;
  return age;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

/** Нарушение уникальности Postgres (drizzle может обернуть ошибку pg в cause) */
export function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } } | undefined;
  return err?.code === '23505' || err?.cause?.code === '23505';
}

/** Убирает undefined-поля (DTO-классы объявляют все свойства, даже не переданные) */
export function definedOnly<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
