import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ example: 'What Romans 8 showed me this week' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @ApiProperty({ description: 'Markdown, the same subset announcements use' })
  @IsString()
  @MinLength(20)
  @MaxLength(40_000)
  body!: string;

  @ApiPropertyOptional({
    example: 45001001,
    description: 'First verse of the passage this came from',
  })
  @IsOptional()
  @IsInt()
  startVerseId?: number;

  @ApiPropertyOptional({ example: 45008039 })
  @IsOptional()
  @IsInt()
  endVerseId?: number;

  @ApiPropertyOptional({ example: 'Romans 8' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  scriptureLabel?: string;

  @ApiPropertyOptional({
    description:
      'Submit for approval by another reviewer rather than saving a draft',
  })
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class UpdateArticleDto {
  @ApiPropertyOptional({
    description:
      'The revision loaded by the editor; prevents overwriting later changes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  revision?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(40_000)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  startVerseId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  endVerseId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  scriptureLabel?: string | null;

  @ApiPropertyOptional({
    enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
}

export class ReviewArticleDto {
  @ApiProperty({ description: 'The revision the reviewer read', minimum: 1 })
  @IsInt()
  @Min(1)
  revision!: number;

  @ApiPropertyOptional({
    description: 'A word to the author with the approval',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  note?: string;
}

export class RequestChangesDto {
  @ApiProperty({ description: 'The revision the reviewer read', minimum: 1 })
  @IsInt()
  @Min(1)
  revision!: number;

  @ApiProperty({
    description:
      'What the author should change. Required: a piece sent back without a reason cannot be fixed.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1_000)
  note!: string;
}
