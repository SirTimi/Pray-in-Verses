import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrayerReportReason, PrayerReportTarget, PrayerReportStatus } from '@prisma/client';

export class CreatePrayerRequestDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(10) description: string;
  @IsString() category: string;
  @IsOptional() @IsBoolean() urgent?: boolean;
  @IsOptional() @IsBoolean() anonymous?: boolean;
}

export class AddCommentDto {
  @IsString() @MinLength(1) body: string;
}

export class ReportPrayerContentDto {
  @IsEnum(PrayerReportTarget)
  targetType!: PrayerReportTarget;

  @IsString()
  @MinLength(1)
  targetId!: string;

  @IsEnum(PrayerReportReason)
  reason!: PrayerReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

export class BlockPrayerAuthorDto {
  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  commentId?: string;
}

export class ReviewPrayerReportDto {
  @IsEnum(PrayerReportStatus)
  status!: PrayerReportStatus;
}
