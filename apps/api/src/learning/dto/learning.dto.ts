import { IsDefined, IsIn, IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

export class LessonIdParamDto {
  @IsUUID()
  id: string;
}

export class LessonExerciseParamDto {
  @IsUUID()
  id: string;

  @IsUUID()
  exerciseId: string;
}

export class LessonBlockParamDto {
  @IsUUID()
  id: string;

  @IsUUID()
  blockId: string;
}

export class SubmitLessonAnswerDto {
  /** Форма зависит от типа упражнения: число, строка, массив — как в placement-тесте. */
  @IsDefined()
  answer: unknown;
}

export class SubmitLessonSpeakingDto {
  @IsString()
  @IsNotEmpty()
  audioKey: string;
}

export class HeartbeatDto {
  @IsInt()
  @Min(1)
  @Max(30)
  seconds: number;
}

export class PracticeQuestionIdParamDto {
  @IsUUID()
  questionId: string;
}

export class SubmitPracticeAnswerDto {
  @IsDefined()
  answer: unknown;
}

export class StudentVocabularyIdParamDto {
  @IsUUID()
  id: string;
}

export class ReviewVocabularyDto {
  /** 0–5 по SM-2; упрощённый интерфейс шлёт обычно 1 («не помню») или 4 («помню»). */
  @IsIn([0, 1, 2, 3, 4, 5])
  quality: number;
}
