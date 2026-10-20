import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** The application form for joining a class. */
export class ApplyDto {
  @ApiProperty({ description: 'Why you want to join this class' })
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  reason!: string;

  @ApiProperty({ enum: ['under_1_month', '1_to_3_months', '3_to_12_months', 'over_1_year'] })
  @IsIn(['under_1_month', '1_to_3_months', '3_to_12_months', 'over_1_year'])
  attendingFor!: 'under_1_month' | '1_to_3_months' | '3_to_12_months' | 'over_1_year';

  @ApiProperty({ enum: ['yes', 'not_sure'] })
  @IsIn(['yes', 'not_sure'])
  bornAgain!: 'yes' | 'not_sure';

  @ApiPropertyOptional({ description: 'Your Home Cell, if you are in one' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  homeCell?: string;

  @ApiPropertyOptional({ description: 'Anything the pastors should know' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ description: 'I commit to attending the sessions and completing every lesson' })
  @IsBoolean()
  commitment!: boolean;
}

export class QuizAnswersDto {
  @ApiProperty({ type: [Number], description: 'The chosen option index for each question, in order (null to skip)' })
  @IsArray()
  @ArrayMaxSize(20)
  answers!: (number | null)[];
}

/** The body is capped so a huge payload is refused early; the summary rules (300 to 3,000 characters) are applied in the service. */
export class SummaryDto {
  @ApiProperty({ description: 'Your private summary of what you learnt' })
  @IsString()
  @MaxLength(8000)
  text!: string;
}

export class StartWatchDto {
  @ApiPropertyOptional({ description: 'Where the player will resume, in seconds. Never past what the server has seen watched.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(86400)
  position?: number;
}

export class HeartbeatDto {
  @ApiProperty({ description: 'Where the player is now, in seconds' })
  @IsNumber()
  @Min(0)
  @Max(86400)
  position!: number;

  @ApiPropertyOptional({ description: 'The furthest the player thinks it has played. Advisory: the server never credits from it.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(86400)
  maxWatched?: number;
}

export class ScriptureDto {
  @ApiProperty({ example: 'Genesis 49:26' }) @IsString() @MaxLength(80) ref!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) text?: string;
}

export class LessonContentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(400) description?: string | null;
  @ApiPropertyOptional({ example: '10 min' }) @IsOptional() @IsString() @MaxLength(40) duration?: string;
  @ApiPropertyOptional({ description: 'Video length in seconds. Looked up from the video host when the link changes; set it here if that fails.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(43200)
  durationSeconds?: number | null;
  @ApiPropertyOptional({ description: '"By the end, you can..."' }) @IsOptional() @IsString() @MaxLength(300) outcome?: string | null;
  @ApiPropertyOptional({ description: 'YouTube (unlisted) link' }) @IsOptional() @IsString() @MaxLength(400) videoUrl?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(3000) summary?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) reflectionPrompt?: string | null;
  @ApiPropertyOptional({ type: [ScriptureDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ScriptureDto)
  scriptures?: ScriptureDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) actionStep?: string | null;
  @ApiPropertyOptional({ enum: ['SELF', 'LEADER'] }) @IsOptional() @IsIn(['SELF', 'LEADER']) actionVerification?: 'SELF' | 'LEADER';
}

export class QuizItemDto {
  @ApiProperty() @IsString() @MaxLength(400) prompt!: string;
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(2) @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(200, { each: true }) options!: string[];
  @ApiProperty() @IsInt() @Min(0) @Max(5) correctIndex!: number;
}

export class QuizDto {
  @ApiProperty({ type: [QuizItemDto] })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => QuizItemDto)
  items!: QuizItemDto[];
}

export class CohortDto {
  @ApiProperty({ example: 'November 2026' }) @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @ApiProperty({ example: '2026-11-01' }) @IsDateString() startsOn!: string;
  @ApiPropertyOptional({ description: 'In-person sessions needed to complete (0 for none)' }) @IsOptional() @IsInt() @Min(0) @Max(20) minSessions?: number;
}

export class UpdateCohortDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsOn?: string;
  @ApiPropertyOptional({ enum: ['OPEN', 'CLOSED'] }) @IsOptional() @IsIn(['OPEN', 'CLOSED']) status?: 'OPEN' | 'CLOSED';
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(20) minSessions?: number;
}

export class SessionDto {
  @ApiProperty({ example: 'Week 1: Welcome to the House' }) @IsString() @MinLength(2) @MaxLength(120) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(12) weekNumber?: number;
  @ApiProperty({ example: '2026-11-01T11:30:00+01:00' }) @IsDateString() startsAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) location?: string;
}

export class MemberRefDto {
  @ApiProperty() @IsString() @MaxLength(64) memberId!: string;
}

export class SessionMarkDto extends MemberRefDto {
  @ApiProperty() @IsBoolean() present!: boolean;
}

export class VerifyDto {
  @ApiProperty() @IsBoolean() verified!: boolean;
}

export class DecisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class MembershipStatusDto {
  @ApiProperty({ enum: ['IN_TRAINING', 'FULL'] }) @IsIn(['IN_TRAINING', 'FULL']) status!: 'IN_TRAINING' | 'FULL';
  @ApiProperty({ description: 'Why, kept on record' }) @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class ExceptionEnrollDto extends MemberRefDto {
  @ApiProperty() @IsString() @MaxLength(64) courseId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) cohortId?: string;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(500) reason!: string;
}

export class ConvertVisitorDto {
  @ApiPropertyOptional({ description: 'Sunday services they attended before the account existed (counts toward class eligibility)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(12)
  creditedSundays?: number;
}
