import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ example: false, description: 'Also send as email' })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
