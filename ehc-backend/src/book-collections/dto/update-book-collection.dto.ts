import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBookCollectionDto {
  @ApiPropertyOptional({ example: 'Faith' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ description: 'Lower shows first' })
  @IsOptional()
  @IsInt()
  order?: number;
}
