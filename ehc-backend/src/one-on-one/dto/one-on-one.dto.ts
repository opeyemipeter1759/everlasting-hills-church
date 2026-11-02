import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsEmail,
  IsUrl,
  ValidateIf,
  Max,
  MaxLength,
  Min,
  MinLength,
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

  @ApiPropertyOptional({ example: 'pastor-faith', description: 'Public share link: /talk-to-a-pastor/<slug>' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  slug?: string;

  @ApiPropertyOptional({ example: 'https://zoom.us/j/1234567890', description: 'Standing Google Meet or Zoom room; empty clears it' })
  @IsOptional()
  @ValidateIf((o: UpdateHostSettingsDto) => Boolean(o.defaultMeetingLink))
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'Use a full https:// meeting link' })
  @MaxLength(500)
  defaultMeetingLink?: string;

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

export const SESSION_TOPICS = ['Counsel', 'Prayer', 'Marriage & family', 'Career & direction', 'Spiritual growth', 'Something else'] as const;
export const MEETING_FORMATS = ['IN_PERSON', 'GOOGLE_MEET', 'PHONE'] as const;

export class CreateRequestDto {
  @ApiProperty({ example: 'host-id' })
  @IsString()
  @IsNotEmpty()
  hostId!: string;

  @ApiProperty({ example: 'session-type-id' })
  @IsString()
  @IsNotEmpty()
  sessionTypeId!: string;

  @ApiProperty({ example: '2026-11-12T12:00:00.000Z', description: 'One of the start times from /slots' })
  @IsISO8601()
  startsAt!: string;

  @ApiProperty({ enum: MEETING_FORMATS })
  @IsIn(MEETING_FORMATS)
  format!: (typeof MEETING_FORMATS)[number];

  @ApiProperty({ enum: SESSION_TOPICS })
  @IsIn(SESSION_TOPICS)
  topic!: (typeof SESSION_TOPICS)[number];

  @ApiPropertyOptional({ description: 'Private to the pastor; stored encrypted' })
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  note?: string;
}

export const FOUND_VIA = ['YouTube', 'Telegram', 'Facebook', 'Instagram', 'A friend', 'Other'] as const;

/** A visitor's request: no account, so who they are comes with it. */
export class CreateVisitorRequestDto extends CreateRequestDto {
  @ApiProperty({ example: 'Daniel Mensah' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'daniel@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '+233 24 123 4567', description: 'WhatsApp or phone' })
  @IsString()
  @MinLength(6)
  @MaxLength(40)
  phone!: string;

  @ApiProperty({ example: 'Accra, Ghana' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location!: string;

  @ApiProperty({ enum: FOUND_VIA })
  @IsIn(FOUND_VIA)
  foundVia!: (typeof FOUND_VIA)[number];

  @ApiProperty({ example: false, description: 'In person is only offered to visitors in or near Ibadan' })
  @IsBoolean()
  inIbadan!: boolean;

  @ApiPropertyOptional({ example: 'Africa/Accra' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ description: 'Left empty by people; bots fill it' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class DecisionNoteDto {
  @ApiPropertyOptional({ example: 'Looking forward to it.' })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  note?: string;
}

export class ApproveDto extends DecisionNoteDto {
  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-defg-hij', description: 'Google Meet or Zoom link for an online session' })
  @IsOptional()
  @ValidateIf((o: ApproveDto) => Boolean(o.meetLink))
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'Use a full https:// meeting link' })
  @MaxLength(500)
  meetLink?: string;
}

export class SetMeetingLinkDto {
  @ApiProperty({ example: 'https://zoom.us/j/1234567890' })
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'Use a full https:// meeting link' })
  @MaxLength(500)
  meetLink!: string;
}

export class ProposeTimeDto extends DecisionNoteDto {
  @ApiProperty({ example: '2026-11-17T09:00:00.000Z' })
  @IsISO8601()
  startsAt!: string;
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
