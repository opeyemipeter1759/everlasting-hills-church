import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitTaskReportOutcome, UnitTaskReportStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUnitTaskReportDto {
  @ApiProperty({ enum: UnitTaskReportOutcome, description: 'Where the task stands as of this report' })
  @IsEnum(UnitTaskReportOutcome)
  outcome!: UnitTaskReportOutcome;

  @ApiProperty({ example: 'Set up all 120 chairs and the two overflow rows before 7:30am; sound check done with the media team.' })
  @IsString()
  @MinLength(10, { message: 'Please write at least a sentence or two about what was done' })
  @MaxLength(4000)
  summary!: string;

  @ApiPropertyOptional({ description: 'Anything that got in the way' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  challenges?: string;

  @ApiPropertyOptional({ description: 'What happens next, or what you need from the lead' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nextSteps?: string;
}

/** Same fields, all optional — the author revising their own report. */
export class UpdateUnitTaskReportDto {
  @ApiPropertyOptional({ enum: UnitTaskReportOutcome })
  @IsOptional()
  @IsEnum(UnitTaskReportOutcome)
  outcome?: UnitTaskReportOutcome;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Please write at least a sentence or two about what was done' })
  @MaxLength(4000)
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  challenges?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nextSteps?: string;
}

export class ReviewUnitTaskReportDto {
  @ApiProperty({ enum: [UnitTaskReportStatus.ACKNOWLEDGED, UnitTaskReportStatus.NEEDS_REVISION] })
  @IsIn([UnitTaskReportStatus.ACKNOWLEDGED, UnitTaskReportStatus.NEEDS_REVISION])
  status!: typeof UnitTaskReportStatus.ACKNOWLEDGED | typeof UnitTaskReportStatus.NEEDS_REVISION;

  @ApiPropertyOptional({ description: 'Feedback for the author — expected when sending a report back' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
