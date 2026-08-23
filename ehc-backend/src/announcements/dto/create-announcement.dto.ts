import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus, Role } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Special Sunday Service' })
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  title!: string;

  @ApiProperty({ example: 'Join us this Sunday for a special time of worship.' })
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  body!: string;

  @ApiPropertyOptional({
    example: 'all',
    description: 'Target audience: "all" | "members" (free-form for now)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  audience?: string;

  @ApiPropertyOptional({ description: 'Image to show alongside the announcement (from /uploads/image)' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @ApiPropertyOptional({ example: false, description: 'Also send as email' })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional({
    enum: EventStatus,
    default: EventStatus.PUBLISHED,
    description: 'PUBLISHED fans out immediately; DRAFT saves without notifying anyone yet.',
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    enum: Role,
    isArray: true,
    description: 'Send to anyone holding any of these roles. Combined (union) with targetGenders/targetProfileIds. Empty = no role restriction.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  targetRoles?: Role[];

  @ApiPropertyOptional({
    type: [String],
    example: ['MALE', 'FEMALE'],
    description: 'Send to members of these genders. Combined (union) with targetRoles/targetProfileIds.',
  })
  @IsOptional()
  @IsArray()
  @IsIn(['MALE', 'FEMALE'], { each: true })
  targetGenders?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Specific Profile ids to always include, regardless of role/gender.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  targetProfileIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Display-only names matching targetProfileIds, in the same order (snapshot at send time).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  targetProfileNames?: string[];

  @ApiPropertyOptional({ example: '10:00 AM', description: 'Event time to display alongside the announcement' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  eventTime?: string;

  @ApiPropertyOptional({ example: 'Main Auditorium', description: 'Venue/location to display alongside the announcement' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  venue?: string;
}
