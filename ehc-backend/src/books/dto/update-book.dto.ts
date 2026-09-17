import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'Mere Christianity' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'C.S. Lewis' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  author?: string;

  @ApiPropertyOptional({ description: 'Or "" to remove it' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ description: 'Cover image URL (from /uploads/image), or "" to remove it' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverUrl?: string;

  @ApiPropertyOptional({ description: 'PDF file URL (from /uploads/document)' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  fileUrl?: string;

  @ApiPropertyOptional({ enum: EventStatus, description: 'Publish or unpublish (DRAFT hides it from members)' })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Move this book to a different shelf' })
  @IsOptional()
  @IsString()
  collectionId?: string;
}
