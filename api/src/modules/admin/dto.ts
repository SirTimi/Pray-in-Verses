import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsEnum(Role)
  role!: Role;
}

export class AcceptInviteDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  name!: string;
}

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role!: Role;
}