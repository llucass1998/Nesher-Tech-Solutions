import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  mfaCode?: string;
}

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/(?=.*[a-z])/, { message: 'Password must contain a lowercase letter.' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain an uppercase letter.' })
  @Matches(/(?=.*\d)/, { message: 'Password must contain a number.' })
  @Matches(/(?=.*[^A-Za-z0-9])/, { message: 'Password must contain a special character.' })
  password!: string;

  @IsOptional()
  @IsString()
  mfaCode?: string;

  @IsOptional()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsString({ each: true })
  audiences?: string[];
}

export class CreateRegistrationRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  company!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^(?:\+?55)?[1-9]\d{9,10}$/, { message: 'Phone must be a valid Brazilian mobile number.' })
  phone!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/(?=.*[a-z])/, { message: 'Password must contain a lowercase letter.' })
  @Matches(/(?=.*[A-Z])/, { message: 'Password must contain an uppercase letter.' })
  @Matches(/(?=.*\d)/, { message: 'Password must contain a number.' })
  @Matches(/(?=.*[^A-Za-z0-9])/, { message: 'Password must contain a special character.' })
  password!: string;
}


export class VerifyMfaDto {
  @IsString()
  code!: string;
}
