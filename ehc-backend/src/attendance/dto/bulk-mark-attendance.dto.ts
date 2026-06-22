import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString } from 'class-validator';

export class BulkMarkAttendanceDto {
  @ApiProperty({ type: [String], description: 'Member user IDs to mark', example: ['member-1', 'member-2'] })
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];

  @ApiProperty({ enum: ['PRESENT', 'ABSENT'], example: 'ABSENT' })
  @IsEnum(['PRESENT', 'ABSENT'])
  status!: 'PRESENT' | 'ABSENT';
}
