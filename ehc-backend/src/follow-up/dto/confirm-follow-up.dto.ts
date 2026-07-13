import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FollowUpOutcome } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmFollowUpDto {
  @ApiProperty({ enum: FollowUpOutcome, example: FollowUpOutcome.BECAME_MEMBER })
  @IsEnum(FollowUpOutcome)
  outcome!: FollowUpOutcome;

  @ApiPropertyOptional({ example: 'Great work — she joined the membership class.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
