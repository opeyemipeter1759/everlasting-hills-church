import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateSermonDto } from './create-sermon.dto';

export class UpdateSermonDto extends PartialType(CreateSermonDto) {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
