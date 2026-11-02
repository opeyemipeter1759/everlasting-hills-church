import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateHostSettingsDto {
  @ApiPropertyOptional({ example: 'Pastor Faith Peter' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Pastor' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  title?: string;

  @ApiPropertyOptional({ example: 'Family, emotional care, and walking through a hard season.' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  bio?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  bufferMinutes?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  dailyCap?: number;

  @ApiPropertyOptional({ example: 48 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(336)
  minNoticeHours?: number;

  @ApiPropertyOptional({ example: 28 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  horizonDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  visitorsAllowed?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  visitorWeeklyCap?: number;

  @ApiPropertyOptional({ example: true, description: 'false hides this pastor from members and visitors' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class WeeklyWindowDto {
  @ApiProperty({ example: 2, description: '0 = Sunday' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({ example: '10:00' })
  @Matches(HHMM, { message: 'startTime must be HH:MM' })
  startTime!: string;

  @ApiProperty({ example: '16:00' })
  @Matches(HHMM, { message: 'endTime must be HH:MM' })
  endTime!: string;
}

export class ReplaceRulesDto {
  @ApiProperty({ type: [WeeklyWindowDto] })
  @IsArray()
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => WeeklyWindowDto)
  rules!: WeeklyWindowDto[];
}

export class CreateBlockDto {
  @ApiProperty({ example: '2026-11-20' })
  @Matches(DATE, { message: 'date must be YYYY-MM-DD' })
  date!: string;

  @ApiPropertyOptional({ example: 'Ministers conference' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  note?: string;
}

export class CreateSessionTypeDto {
  @ApiProperty({ example: 'Counsel & prayer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ example: 'An hour to talk and pray together.' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(30)
  @Max(240)
  durationMinutes!: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  visitorsCanBook?: boolean;

  @ApiPropertyOptional({ example: 'host-id', description: 'Offer this session with both pastors together' })
  @IsOptional()
  @IsString()
  jointWithHostId?: string;
}

export class UpdateSessionTypeDto {
  @ApiPropertyOptional({ example: 'Counsel & prayer' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(240)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  visitorsCanBook?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AddDelegateDto {
  @ApiProperty({ example: 'profile-id' })
  @IsString()
  @IsNotEmpty()
  profileId!: string;
}

export class SlotsQueryDto {
  @ApiProperty({ example: 'session-type-id' })
  @IsString()
  @IsNotEmpty()
  sessionTypeId!: string;

  @ApiProperty({ example: '2026-11-01' })
  @Matches(DATE, { message: 'from must be YYYY-MM-DD' })
  from!: string;

  @ApiProperty({ example: '2026-11-30' })
  @Matches(DATE, { message: 'to must be YYYY-MM-DD' })
  to!: string;
}
