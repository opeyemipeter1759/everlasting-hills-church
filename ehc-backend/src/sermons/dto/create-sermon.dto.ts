import { ApiProperty } from '@nestjs/swagger';
import { SermonStatus, SermonType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { SermonEpisodeInputDto } from './sermon-episode.dto';

export class CreateSermonDto {
  @ApiProperty({ example: 'The Power of Faith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Pastor John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  speaker!: string;

  @ApiProperty({ example: '2026-05-25T09:00:00.000Z' })
  @IsISO8601()
  date!: string;

  @ApiProperty({ enum: SermonType, example: SermonType.SINGLE, required: false })
  @IsOptional()
  @IsEnum(SermonType)
  type?: SermonType;

  @ApiProperty({ example: 'https://cdn.example.com/audio.mp3', required: false, description: 'Primary URL for a single sermon.' })
  @ValidateIf((dto) => (dto.type ?? SermonType.SINGLE) === SermonType.SINGLE)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  url?: string;

  @ApiProperty({ example: 3150, required: false, description: 'Primary duration for a single sermon, in seconds.' })
  @ValidateIf((dto) => (dto.type ?? SermonType.SINGLE) === SermonType.SINGLE)
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiProperty({ type: SermonEpisodeInputDto, isArray: true, required: false, description: 'Episode list for a series sermon.' })
  @ValidateIf((dto) => (dto.type ?? (dto.episodes?.length ? SermonType.SERIES : SermonType.SINGLE)) === SermonType.SERIES)
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SermonEpisodeInputDto)
  episodes?: SermonEpisodeInputDto[];

  @ApiProperty({ example: 'A message on trusting God through trials.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'Full transcript text...', required: false })
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiProperty({ example: 'Hebrews 11:1', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  scriptureRef?: string;

  @ApiProperty({ example: 'Faith Series', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  series?: string;

  @ApiProperty({ example: ['faith', 'hope'], required: false, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'https://cdn.example.com/audio.mp3', required: false })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  audioUrl?: string;

  @ApiProperty({ example: 'storage/audio-key', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  audioKey?: string;

  @ApiProperty({ example: 3150, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  audioDuration?: number;

  @ApiProperty({ example: 'https://youtube.com/watch?v=abc123', required: false })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  videoUrl?: string;

  @ApiProperty({ example: 'https://cdn.example.com/thumbnail.jpg', required: false })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  thumbnailUrl?: string;

  @ApiProperty({ example: 'DRAFT', required: false, enum: SermonStatus })
  @IsOptional()
  @IsEnum(SermonStatus)
  status?: SermonStatus;

  @ApiProperty({ example: '2026-06-01T09:00:00.000Z', required: false })
  @IsOptional()
  @IsISO8601()
  scheduledFor?: string;
}
