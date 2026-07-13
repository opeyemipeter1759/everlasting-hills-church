import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FollowUpSourceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/** Add a first-timer (Visitor) or absentee (Member) to a unit's follow-up Master List. */
export class CreateFollowUpEntryDto {
  @ApiPropertyOptional({ description: 'Defaults to the leader\'s own unit if omitted' })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiProperty({ enum: FollowUpSourceType, example: FollowUpSourceType.FIRST_TIMER })
  @IsEnum(FollowUpSourceType)
  sourceType!: FollowUpSourceType;

  @ApiPropertyOptional({ description: 'Required when sourceType = ABSENTEE' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Required when sourceType = FIRST_TIMER' })
  @IsOptional()
  @IsString()
  visitorId?: string;

  @ApiPropertyOptional({ description: 'Optionally assign immediately' })
  @IsOptional()
  @IsString()
  assigneeId?: string;
}
