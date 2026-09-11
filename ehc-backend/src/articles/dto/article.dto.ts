import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @ApiPropertyOptional({ example: 45001001, description: 'First verse of the passage this came from' })
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

  @ApiPropertyOptional({ description: 'Publish immediately rather than saving a draft' })
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class UpdateArticleDto {
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

  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}
