import { IsDefined, IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AttemptIdParamDto {
  @IsUUID()
  id: string;
}

export class SubmitAnswerDto {
  @IsUUID()
  questionId: string;

  /** Форма зависит от типа вопроса: число (MULTIPLE_CHOICE), строка (FILL_BLANK), массив (MATCHING/ORDERING). */
  @IsDefined()
  answer: unknown;
}

export class SubmitSpeakingDto {
  @IsUUID()
  questionId: string;

  /** Ключ файла в приватном бакете speaking — получен через presign, дальше грузится напрямую в MinIO. */
  @IsString()
  @IsNotEmpty()
  audioKey: string;
}

export class PresignSpeakingDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsIn(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'])
  contentType: string;
}
