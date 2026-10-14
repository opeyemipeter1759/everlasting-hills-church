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
  IsUrl,
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
  @MaxLength(300)
  scriptureLabel?: string;

  @ApiPropertyOptional({ description: 'A one-line subtitle under the title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string | null;

  @ApiPropertyOptional({ description: 'Cover picture, from POST /articles/cover' })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(1000)
  coverImageUrl?: string | null;

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
  @MaxLength(300)
  scriptureLabel?: string | null;

  @ApiPropertyOptional({ description: 'A one-line subtitle under the title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string | null;

  @ApiPropertyOptional({ description: 'Cover picture, from POST /articles/cover' })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(1000)
  coverImageUrl?: string | null;

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

export class ArticleCommentDto {
  @ApiProperty({ description: 'The comment, up to 1,000 characters' })
  @IsString()
  @MaxLength(1000)
  body!: string;
}

export class PublicArticleCommentDto extends ArticleCommentDto {
  @ApiProperty({ description: 'The name the visitor gives' })
  @IsString()
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ description: 'Left empty by people; bots fill it in' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class ReviewNoteDto {
  @ApiProperty({ description: 'The comment, up to 2,000 characters' })
  @IsString()
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ description: 'The highlighted words the comment is about' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  quote?: string | null;

  @ApiPropertyOptional({ description: 'Suggested wording to replace the highlighted words' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  suggestion?: string | null;
}

export class ResolveReviewNoteDto {
  @ApiProperty()
  @IsBoolean()
  resolved!: boolean;
}
