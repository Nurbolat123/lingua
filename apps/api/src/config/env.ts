import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  CONSENT_VERSION: z.string().min(1).default('2026-09-v1'),

  // S3/MinIO — учебные материалы (аудио, картинки). Публичный бакет: это не персональные
  // данные, поэтому без presigned GET на чтение.
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().default('soyleup'),
  S3_SECRET_KEY: z.string().default('soyleup-minio'),
  S3_BUCKET_CONTENT: z.string().default('content'),
  S3_PUBLIC_URL_BASE: z.string().default('http://localhost:9000/content'),
  // Приватный бакет для голосовых записей учеников (placement test, этап 3). Presigned GET
  // для прослушивания куратором и журнал доступа — этап 5.
  S3_BUCKET_SPEAKING: z.string().default('speaking'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
  }
  return parsed.data;
}
