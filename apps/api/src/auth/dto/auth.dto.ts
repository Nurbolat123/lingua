import {
  Equals, IsEmail, IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  /** 8–72 символа (ограничение 72 совместимо с любыми хешерами) */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  /** Публичная регистрация доступна только ученикам и родителям */
  @IsIn(['STUDENT', 'PARENT'])
  role: 'STUDENT' | 'PARENT';

  /** Обязательна для ученика, формат YYYY-MM-DD */
  @ValidateIf((o: RegisterDto) => o.role === 'STUDENT')
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string;

  @IsOptional()
  @IsIn(['ru', 'kk', 'en'])
  locale?: 'ru' | 'kk' | 'en';

  /** Принятие условий и политики обработки персональных данных */
  @Equals(true)
  acceptTerms: boolean;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refreshToken: string;
}
