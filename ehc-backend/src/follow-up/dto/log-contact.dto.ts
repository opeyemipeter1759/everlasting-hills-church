import { ApiProperty } from '@nestjs/swagger';
import { FollowUpContactMethod, FollowUpContactOutcome } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class LogContactDto {
  @ApiProperty({ enum: FollowUpContactMethod, example: FollowUpContactMethod.CALL })
  @IsEnum(FollowUpContactMethod)
  method!: FollowUpContactMethod;

  @ApiProperty({ enum: FollowUpContactOutcome, example: FollowUpContactOutcome.REACHED })
  @IsEnum(FollowUpContactOutcome)
  outcome!: FollowUpContactOutcome;

  @ApiProperty({ example: 'Spoke with her, she plans to visit again this Sunday.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note!: string;
}
