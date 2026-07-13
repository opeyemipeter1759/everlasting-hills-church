import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectFollowUpDto {
  @ApiProperty({ example: 'Only two attempts logged — please try once more before closing.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note!: string;
}
