import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  // Do not enforce the new minimum here.
  // Existing users may have passwords created
  // under the previous 6-character policy.
  @IsString()
  password!: string;
}