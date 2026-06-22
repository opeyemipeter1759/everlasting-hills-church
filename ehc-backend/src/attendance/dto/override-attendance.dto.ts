import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class OverrideAttendanceDto {
  @ApiProperty({ enum: ['PRESENT', 'ABSENT'], example: 'PRESENT' })
  @IsEnum(['PRESENT', 'ABSENT'])
  status!: 'PRESENT' | 'ABSENT';
}
