import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUnitTaskCommentDto {
  @ApiProperty({ example: 'Started on this, should be done by Friday.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;
}
