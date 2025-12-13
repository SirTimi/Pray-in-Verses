// src/notifications/dto/create-notification.dto.ts
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ArrayNotEmpty,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { NotificationAudience, Role } from '@prisma/client';

/**
 * Single DTO to cover:
 * - Broadcast to ALL users
 * - Broadcast to specific ROLE(s)
 * - Broadcast to specific USER IDs
 *
 * Controller/service should set default audience = ALL when not provided.
 */
export class CreateNotificationDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  link?: string;

  // If omitted, service should default to NotificationAudience.ALL
  @IsOptional()
  @IsEnum(NotificationAudience)
  audience?: NotificationAudience; // ALL | ROLE | USER | (ACTIVE if your enum has it)

  /**
   * When audience === ROLE:
   * - You may pass a single role (role) OR an array (roles).
   */
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsArray()
  roles?: Role[]; // alternative input for multiple roles

  /**
   * When audience === USER:
   * - userIds is required and must be non-empty
   */
  @ValidateIf((o) => o.audience === 'USER')
  @IsArray()
  @ArrayNotEmpty()
  userIds?: string[];
}
