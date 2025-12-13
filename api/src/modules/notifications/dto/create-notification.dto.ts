// src/notifications/dto/create-notification.dto.ts
import { IsArray, IsEnum, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';
import { NotificationAudience, Role } from '@prisma/client';

export class CreateNotificationDto {
  @IsString() title!: string;
  @IsString() body!: string;
  @IsOptional() @IsString() link?: string;

  @IsEnum(NotificationAudience)
  audience!: NotificationAudience; // ALL | ROLE | USER

  @IsOptional() @IsArray()
  roles?: Role[]; // required if audience=ROLE

  @IsOptional() @IsArray() @ArrayNotEmpty()
  userIds?: string[]; // required if audience=USER
}
