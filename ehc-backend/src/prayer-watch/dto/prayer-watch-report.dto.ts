import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class SubmitPrayerWatchReportDto {
  @ApiProperty({ example: 'slot-id' })
  @IsString()
  @IsNotEmpty()
  slotId!: string;

  @ApiProperty({ example: '2026-11-09', description: 'The evening the night began, Lagos time' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'nightDate must be YYYY-MM-DD' })
  nightDate!: string;

  @ApiProperty({ example: '22:00', description: 'When the watch actually began' })
  @Matches(HHMM, { message: 'startTime must be HH:MM' })
  startTime!: string;

  @ApiProperty({ example: '00:00', description: 'When it ended and was handed on' })
  @Matches(HHMM, { message: 'endTime must be HH:MM' })
  endTime!: string;

  @ApiProperty({ example: 14, description: 'How many prayed on the watch' })
  @IsInt()
  @Min(0)
  @Max(1000)
  peoplePresent!: number;

  @ApiProperty({ example: true, description: 'Handed over to the next watch, or closed the night for the last one' })
  @IsBoolean()
  handedOver!: boolean;

  @ApiPropertyOptional({ example: 'Bisi Ojo', description: 'Who took over, when not the next watch leader' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  handedOverTo?: string;

  @ApiPropertyOptional({ example: 'Strong night. We prayed for the exam students.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
