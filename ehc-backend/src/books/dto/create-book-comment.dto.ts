import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBookCommentDto {
  @ApiProperty({ example: 'This chapter really challenged me.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
