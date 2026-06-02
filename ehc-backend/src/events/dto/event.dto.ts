import { ApiProperty, PartialType } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

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
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tagline?: string;

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
  mapsLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  flyerImageUrl?: string;

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

  @ApiProperty({ required: false, description: 'Max attendees across all RSVPs.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ required: false, description: 'Bespoke public route override, e.g. /events/heaven-on-earth.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  customPath?: string;

  @ApiProperty({ required: false, description: 'Lower numbers appear first.' })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
