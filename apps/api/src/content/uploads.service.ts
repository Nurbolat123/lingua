import { BadGatewayException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { createS3Client, ensureBucketQuiet } from '../common/s3';
import { Env } from '../config/env';
import { PresignUploadDto } from './dto/uploads.dto';

const UPLOAD_URL_TTL_SECONDS = 5 * 60;

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.bucket = config.get('S3_BUCKET_CONTENT', { infer: true });
    this.publicUrlBase = config.get('S3_PUBLIC_URL_BASE', { infer: true }).replace(/\/$/, '');
    this.client = createS3Client({
      endpoint: config.get('S3_ENDPOINT', { infer: true }),
      region: config.get('S3_REGION', { infer: true }),
      accessKey: config.get('S3_ACCESS_KEY', { infer: true }),
      secretKey: config.get('S3_SECRET_KEY', { infer: true }),
    });
  }

  /** Не блокирует запуск API, если MinIO недоступен — загрузка файлов просто не будет работать. */
  async onModuleInit() {
    await ensureBucketQuiet(this.client, this.bucket, { publicRead: true });
  }

  async presign(dto: PresignUploadDto) {
    const ext = dto.fileName.includes('.') ? dto.fileName.split('.').pop() : undefined;
    const key = `${randomUUID()}${ext ? `.${ext}` : ''}`;

    try {
      const uploadUrl = await getSignedUrl(
        this.client,
        new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: dto.contentType }),
        { expiresIn: UPLOAD_URL_TTL_SECONDS },
      );
      return { uploadUrl, fileUrl: `${this.publicUrlBase}/${key}`, key, expiresIn: UPLOAD_URL_TTL_SECONDS };
    } catch (e) {
      throw new BadGatewayException(`Хранилище файлов недоступно: ${(e as Error).message}`);
    }
  }
}
