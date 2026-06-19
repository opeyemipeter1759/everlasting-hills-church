import { ApiProperty } from '@nestjs/swagger';

export class AttendanceOverviewDto {
  @ApiProperty({ type: Number, example: 2, description: 'Services attended this month' })
  marked: number;

  @ApiProperty({ type: Number, example: 8, description: 'Total service days (Sundays + Wednesdays) this month' })
  total: number;

  @ApiProperty({ type: Number, example: 25, description: 'Attendance percentage for the month' })
  percentage: number;

  @ApiProperty({ type: Date, nullable: true, example: '2026-06-15T07:30:00.000Z', description: 'Last service the member attended' })
  lastMarkedAt: Date | null;
}

export class MemberOverviewResponseDto {
  @ApiProperty({ type: AttendanceOverviewDto })
  attendance: AttendanceOverviewDto;
}
