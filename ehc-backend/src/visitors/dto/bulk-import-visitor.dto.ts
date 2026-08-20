import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// The Visitor columns behind these fields are all plain unbounded Postgres `text`
// (no @db.VarChar(n) in schema.prisma) — there is no real length constraint to
// mirror here. Historical CSV exports (Google Forms, etc.) routinely put oddly
// long values in "short" fields (a phone cell with two numbers and labels, an
// occupation that's actually a paragraph, ...), and because @ValidateNested
// validates the whole rows[] array up front, any one row tripping a limit 400s
// the entire batch before the per-row try/catch in the service ever runs. So
// these caps are generous headroom against pathological input, not realistic
// expectations — prefer accepting messy data over rejecting a good 100-row batch
// for one long cell.
export class VisitorImportRowDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MaxLength(200)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(200)
  lastName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  phone?: string;

  // Not @IsEmail() on purpose — historical CSV exports sometimes carry
  // truncated/malformed values here, and this is a backfill of old records, not
  // a live-form submission; rejecting the whole batch over one bad cell isn't worth it.
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gender?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  howDidYouLearn?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  invitedBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  locatedInIbadan?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  membershipInterest?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address?: string;

  @ApiProperty({ required: false, description: 'Day of birth, 1-31 (no year collected)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  birthDay?: number;

  @ApiProperty({ required: false, description: 'Month of birth, 1-12' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  birthMonth?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  occupation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bornAgain?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  serviceExperience?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  prayerPoint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  whatsappInterest?: boolean;

  @ApiProperty({ required: false, description: 'Original submission timestamp, for backfilling historical data' })
  @IsOptional()
  @IsISO8601()
  submittedAt?: string;
}

export class BulkImportVisitorsDto {
  @ApiProperty({ type: [VisitorImportRowDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => VisitorImportRowDto)
  rows!: VisitorImportRowDto[];

  @ApiProperty({
    required: false,
    default: true,
    description: 'Email each newly-created row the first-timer welcome email. Defaults to true.',
  })
  @IsOptional()
  @IsBoolean()
  sendWelcome?: boolean;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Also send the welcome email to rows skipped as already-existing — for re-sending to a batch that was previously imported without emails.',
  })
  @IsOptional()
  @IsBoolean()
  alsoWelcomeExisting?: boolean;
}
