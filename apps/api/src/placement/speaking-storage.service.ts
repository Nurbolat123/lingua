import { BadGatewayException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { createS3Client, ensureBucketQuiet } from '../common/s3';
import { Env } from '../config/env';
import { PresignSpeakingDto } from './dto/placement.dto';

const UPLOAD_URL_TTL_SECONDS = 5 * 60;

/**
 * Приватный бакет для голосовых записей учеников (в отличие от общедоступного `content`
 * для учебных материалов). Presigned GET для прослушивания куратором появится на этапе 5
 * вместе с журналом доступа к записям — сейчас только приём загрузки.
 */
@Injectable()
export class SpeakingStorageService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.bucket = config.get('S3_BUCKET_SPEAKING', { infer: true });
    this.client = createS3Client({
      endpoint: config.get('S3_ENDPOINT', { infer: true }),
      region: config.get('S3_REGION', { infer: true }),
      accessKey: config.get('S3_ACCESS_KEY', { infer: true }),
      secretKey: config.get('S3_SECRET_KEY', { infer: true }),
    });
  }

  async onModuleInit() {
    await ensureBucketQuiet(this.client, this.bucket, { publicRead: false });
  }

  async presign(dto: PresignSpeakingDto, studentId: string) {
    const ext = dto.fileName.includes('.') ? dto.fileName.split('.').pop() : 'webm';
    const key = `${studentId}/${randomUUID()}.${ext}`;
    try {
      const uploadUrl = await getSignedUrl(
        this.client,
        new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: dto.contentType }),
        { expiresIn: UPLOAD_URL_TTL_SECONDS },
      );
      return { uploadUrl, key, expiresIn: UPLOAD_URL_TTL_SECONDS };
    } catch (e) {
      throw new BadGatewayException(`Хранилище файлов недоступно: ${(e as Error).message}`);
    }
  }
}
