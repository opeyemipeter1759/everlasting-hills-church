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

export class TaskRequirementDto {
  @ApiProperty({ type: Number, example: 2, description: 'Services to attend' })
  attendance: number;

  @ApiProperty({ type: Number, example: 0, description: 'Courses to complete' })
  course: number;

  @ApiProperty({ type: Number, example: 1, description: 'Sermons to finish' })
  sermon: number;
}

export class PassedLevelDto {
  @ApiProperty({ type: Number, example: 3, description: 'The level that was cleared' })
  level: number;

  @ApiProperty({ type: String, example: 'Seeker', description: 'Rank title held at that level' })
  title: string;

  @ApiProperty({ type: TaskRequirementDto, description: 'The task that was completed to clear it' })
  task: TaskRequirementDto;
}

export class StreakDto {
  @ApiProperty({ type: Number, example: 6, description: 'Current level on the endless task ladder' })
  level: number;

  @ApiProperty({ type: String, example: 'Believer', description: 'Rank title for the current level' })
  title: string;

  @ApiProperty({ type: TaskRequirementDto, description: 'The task required to clear the current level' })
  task: TaskRequirementDto;

  @ApiProperty({ type: TaskRequirementDto, description: "Progress already banked toward the current level's task" })
  progress: TaskRequirementDto;

  @ApiProperty({ type: [PassedLevelDto], description: 'Every level already cleared, oldest first' })
  history: PassedLevelDto[];
}

export class MemberOverviewResponseDto {
  @ApiProperty({ type: AttendanceOverviewDto })
  attendance: AttendanceOverviewDto;

  @ApiProperty({ type: StreakDto, description: '2go-style leveling ladder combining lifetime attendance, course completions, and sermon completions' })
  streak: StreakDto;

  @ApiProperty({ type: Number, example: 2, description: 'Number of courses this member has completed (scored 100% on the exam)' })
  coursesCompleted: number;

  @ApiProperty({ type: Number, example: 5, description: 'Number of sermons this member has listened to in full' })
  sermonsCompleted: number;
}
