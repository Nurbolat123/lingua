import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const CEFR_TARGETS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export class UpdateMeDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80)
  firstName?: string;

  @IsOptional() @IsString() @MaxLength(80)
  lastName?: string;

  @IsOptional() @IsIn(['ru', 'kk', 'en'])
  locale?: 'ru' | 'kk' | 'en';

  /** Только для ученика */
  @IsOptional() @IsIn(CEFR_TARGETS)
  targetLevel?: (typeof CEFR_TARGETS)[number];

  /** Только для ученика */
  @IsOptional() @IsString() @MaxLength(300)
  goal?: string;

  /** Только для ученика */
  @IsOptional() @IsInt() @Min(5) @Max(180)
  dailyMinutes?: number;
}
