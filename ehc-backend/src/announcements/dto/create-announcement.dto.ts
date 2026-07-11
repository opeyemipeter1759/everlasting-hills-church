import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
