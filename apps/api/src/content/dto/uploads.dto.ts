import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const ALLOWED_CONTENT_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
  'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
] as const;

export class PresignUploadDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  fileName: string;

  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType: (typeof ALLOWED_CONTENT_TYPES)[number];
}
