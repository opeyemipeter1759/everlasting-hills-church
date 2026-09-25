import { ApiProperty, PartialType } from '@nestjs/swagger';
import { EventLocationType, EventSectionType, EventStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsString,
  Matches,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const WEB_OR_INTERNAL_PATH = /^(https?:\/\/|\/)/i;
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

export class EventScheduleInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @Matches(TIME_OF_DAY, { message: 'startTime must use HH:MM (24-hour)' })
  startTime!: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_OF_DAY, { message: 'endTime must use HH:MM (24-hour)' })
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  recurrenceRule?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH, { message: 'meetingUrl must be an http(s) URL or internal path' })
  meetingUrl?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class EventSectionInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(EventSectionType)
  type!: EventSectionType;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @IsObject()
  content!: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

/**
 * URL-ish fields (flyerImageUrl, mapsLink) are kept as plain strings rather than
 * @IsUrl: flyers come from the /uploads/image endpoint (which may return either a
 * full R2 URL or a bare key) and maps links are pasted by admins — we don't want
 * strict URL validation blocking a save.
 */
export class CreateEventDto {
  @ApiProperty({ example: 'Heaven on Earth' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ required: false, description: 'Auto-derived from title if omitted.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must use lowercase letters, numbers, and hyphens' })
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tagline?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  theme?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: '2026-08-15T17:00:00+01:00' })
  @IsISO8601()
  startAt!: string;

  @ApiProperty({ required: false, example: '2026-08-15T21:00:00+01:00' })
  @IsOptional()
  @IsISO8601()
  endAt?: string;

  @ApiProperty({ required: false, default: 'Africa/Lagos' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @ApiProperty({ enum: EventLocationType, required: false })
  @IsOptional()
  @IsEnum(EventLocationType)
  locationType?: EventLocationType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  venueName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  venueAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(WEB_OR_INTERNAL_PATH)
  mapsLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH)
  flyerImageUrl?: string;

  @ApiProperty({ required: false, description: 'Portrait/square event poster.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH)
  coverImageUrl?: string;

  @ApiProperty({ required: false, description: 'Wide hero art, rendered with object-cover.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH)
  heroImageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH)
  socialImageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH)
  liveUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH)
  registrationUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH)
  testimonyUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  primaryCtaLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH)
  primaryCtaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  secondaryCtaLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(WEB_OR_INTERNAL_PATH)
  secondaryCtaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  hostName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  guestMinister?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Matches(/^(https?:\/\/|\+?[0-9])/i, { message: 'contactWhatsapp must be a URL or phone number' })
  contactWhatsapp?: string;

  @ApiProperty({ enum: EventStatus, required: false })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  rsvpEnabled?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  registrationRequired?: boolean;

  @ApiProperty({ required: false, description: 'Max attendees across all RSVPs.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ required: false, description: 'Bespoke public route override, e.g. /events/heaven-on-earth.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^\/(?!\/)/, { message: 'customPath must be an internal path beginning with /' })
  customPath?: string;

  @ApiProperty({ required: false, description: 'Lower numbers appear first.' })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ required: false, type: [EventScheduleInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @ValidateNested({ each: true })
  @Type(() => EventScheduleInputDto)
  schedules?: EventScheduleInputDto[];

  @ApiProperty({ required: false, type: [EventSectionInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => EventSectionInputDto)
  sections?: EventSectionInputDto[];
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

/**
 * Window for the calendar grid. `from`/`to` are the first and last instant the
 * visible grid covers — for a month view that is the leading/trailing days of the
 * adjacent months too, not just the 1st to the 31st, so events on those spill-over
 * cells still render.
 */
export class CalendarQueryDto {
  @ApiProperty({ description: 'Window start, ISO 8601.', example: '2026-06-28T00:00:00.000Z' })
  @IsISO8601()
  from!: string;

  @ApiProperty({ description: 'Window end, ISO 8601.', example: '2026-08-09T23:59:59.999Z' })
  @IsISO8601()
  to!: string;
}
