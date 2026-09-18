import { IsIn, IsNotEmpty, IsString } from 'class-validator';

/** Presigned-загрузка в приватный бакет speaking — общая для placement-теста и плеера урока. */
export class PresignSpeakingDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsIn(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'])
  contentType: string;
}
