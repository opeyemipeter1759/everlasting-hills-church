import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Edits title/body/email-flag only — status transitions go through /publish. */
export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ example: 'Special Sunday Service' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  title?: string;

  @ApiPropertyOptional({ example: 'Join us this Sunday for a special time of worship.' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  body?: string;

  @ApiPropertyOptional({ example: false, description: 'Also send as email (only applies on next publish)' })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @ApiPropertyOptional({ description: 'Image to show alongside the announcement (from /uploads/image), or "" to remove it' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @ApiPropertyOptional({
    enum: Role,
    isArray: true,
    description: 'Only applies on the next publish (a change here never re-triggers a fan-out).',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  targetRoles?: Role[];

  @ApiPropertyOptional({ type: [String], example: ['MALE', 'FEMALE'] })
  @IsOptional()
  @IsArray()
  @IsIn(['MALE', 'FEMALE'], { each: true })
  targetGenders?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  targetProfileIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  targetProfileNames?: string[];

  @ApiPropertyOptional({ example: '10:00 AM' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  eventTime?: string;

  @ApiPropertyOptional({ example: 'Main Auditorium', description: 'Or "" to remove it' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  venue?: string;
}
