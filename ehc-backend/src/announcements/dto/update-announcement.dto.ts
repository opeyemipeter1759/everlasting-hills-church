import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
