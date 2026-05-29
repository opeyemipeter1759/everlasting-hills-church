import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Sade Adeyemi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  authorName!: string;

  @ApiProperty({ example: 'Member since 2018', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorRole?: string;

  @ApiProperty({ example: 'https://cdn.example.com/people/sade.jpg', required: false })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  authorPhotoUrl?: string;

  @ApiProperty({ example: 'Everlasting Hills has been a home for me…' })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(1500)
  content!: string;

  @ApiProperty({ example: true, required: false, description: 'Whether to show on public site immediately' })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiProperty({ example: 0, required: false, description: 'Lower numbers appear first' })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateTestimonialDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorRole?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  authorPhotoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(1500)
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  order?: number;
}
