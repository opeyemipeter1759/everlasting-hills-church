import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReadingTrack } from '@prisma/client';
import { READING_INTENSITIES, type ReadingIntensity } from '../reading-intensity';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ description: 'Plan to read, from GET /reading-plans' })
  @IsString()
  @MaxLength(64)
  planId!: string;

  @ApiPropertyOptional({ example: 'WEB', description: 'Defaults to the default translation' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  translationCode?: string;

  @ApiPropertyOptional({
    example: 'Africa/Lagos',
    description:
      'IANA zone. Completion dates and streaks are recorded against this, never UTC, so a member reading at half past midnight is not recorded against yesterday.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 23, description: 'Local hour for a reminder' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  reminderHour?: number;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'PAUSED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'PAUSED'])
  status?: 'ACTIVE' | 'PAUSED';

  @ApiPropertyOptional({ example: 'KJV' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  translationCode?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 23, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  reminderHour?: number | null;

  @ApiPropertyOptional({ example: 'Africa/Lagos' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}

export class ListPlansQueryDto {
  @ApiPropertyOptional({ enum: ReadingTrack })
  @IsOptional()
  @IsEnum(ReadingTrack)
  track?: ReadingTrack;

  @ApiPropertyOptional({
    enum: [...READING_INTENSITIES],
    description: 'Daily reading load: LOW up to 5 minutes, MEDIUM 6–15 minutes, HIGH over 15 minutes.',
  })
  @IsOptional()
  @IsIn(READING_INTENSITIES)
  intensity?: ReadingIntensity;
}
