// src/modules/admin-curated/dto/admin-curated.dto.ts
import { IsArray, IsInt, IsOptional, IsString, Min, MinLength, IsIn } from 'class-validator';

export class CreateCuratedPrayerDto {
  @IsString() @MinLength(1) book!: string;
  @IsInt() @Min(1) chapter!: number;
  @IsInt() @Min(1) verse!: number;
  @IsString() @MinLength(1) theme!: string;
  @IsString() @MinLength(1) scriptureText!: string;
  @IsString() @MinLength(1) insight!: string;
  @IsArray() @IsString({ each: true }) prayerPoints!: string[]; // no ArrayNotEmpty here
  @IsString() @MinLength(1) closing!: string;
}

export class UpdateCuratedPrayerDto {
  @IsOptional() @IsString() book?: string;
  @IsOptional() @IsInt() @Min(1) chapter?: number;
  @IsOptional() @IsInt() @Min(1) verse?: number;
  @IsOptional() @IsString() @MinLength(1) theme?: string;
  @IsOptional() @IsString() @MinLength(1) scriptureText?: string;
  @IsOptional() @IsString() @MinLength(1) insight?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) prayerPoints?: string[];
  @IsOptional() @IsString() @MinLength(1) closing?: string;
}

export class ListQuery {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() state?: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  @IsOptional() @IsString() book?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
}

export class TransitionDto {
  @IsString() @IsIn(['REVIEW','PUBLISHED','ARCHIVED']) target!: 'REVIEW'|'PUBLISHED'|'ARCHIVED';
}

/** 🔽 NEW: prayer-point specific DTOs */
export class PrayerPointsReplaceDto {
  @IsArray() @IsString({ each: true })
  items!: string[];
}

export class PrayerPointTextDto {
  @IsString() @MinLength(1)
  text!: string; // must be non-empty after trimming (we'll trim in service)
}

export class PrayerPointsReorderDto {
  @IsInt() from!: number;
  @IsInt() to!: number;
}

export class UpdatePublishStateDto {
  @IsString()
  @IsIn(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'])
  state!: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
}