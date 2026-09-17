import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: 'Mere Christianity' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'C.S. Lewis' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  author?: string;

  @ApiPropertyOptional({ example: 'A classic case for the reasonableness of Christian faith.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ description: 'Cover image URL (from /uploads/image)' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverUrl?: string;

  @ApiProperty({ description: 'PDF file URL (from /uploads/document) — what members read in-browser' })
  @IsString()
  @MaxLength(2048)
  fileUrl!: string;

  @ApiProperty({ description: 'The shelf this book sits on, from GET /book-collections' })
  @IsString()
  collectionId!: string;

  @ApiPropertyOptional({
    enum: EventStatus,
    default: EventStatus.PUBLISHED,
    description: 'PUBLISHED is visible to members immediately; DRAFT stages it first.',
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
