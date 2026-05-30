import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class SermonEpisodeInputDto {
  @ApiProperty({ example: 'ep-2', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  id?: string;

  @ApiProperty({ example: 'Part 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'https://cdn.example.com/part-1.mp3' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  url!: string;

  @ApiProperty({ example: 1800 })
  @IsInt()
  @Min(0)
  duration!: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}