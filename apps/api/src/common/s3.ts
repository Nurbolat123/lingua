import { Logger } from '@nestjs/common';
import { CreateBucketCommand, PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3';

const logger = new Logger('S3Bootstrap');

export function createS3Client(opts: {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
}): S3Client {
  return new S3Client({
    endpoint: opts.endpoint,
    region: opts.region,
    forcePathStyle: true,
    credentials: { accessKeyId: opts.accessKey, secretAccessKey: opts.secretKey },
  });
}

const publicReadPolicy = (bucket: string) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });

/**
 * Создаёt бакет, если его ещё нет (не падает, если уже есть). Не блокирует запуск API,
 * если MinIO недоступен — вызывающий сервис просто логирует предупреждение и работает
 * без загрузки файлов, пока хранилище не поднимется.
 */
export async function ensureBucket(client: S3Client, bucket: string, opts: { publicRead?: boolean } = {}): Promise<void> {
  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  } catch (e) {
    const code = (e as { name?: string }).name;
    if (code !== 'BucketAlreadyOwnedByYou' && code !== 'BucketAlreadyExists') throw e;
  }
  if (opts.publicRead) {
    await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: publicReadPolicy(bucket) }));
  }
}

export async function ensureBucketQuiet(client: S3Client, bucket: string, opts: { publicRead?: boolean } = {}): Promise<void> {
  try {
    await ensureBucket(client, bucket, opts);
  } catch (e) {
    logger.warn(`S3/MinIO недоступен при старте (${(e as Error).message}). Загрузка файлов будет недоступна, пока хранилище не поднимется.`);
  }
}
