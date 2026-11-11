import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReadinessStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/** A unit's update on its plan: everything ready, or a blocker and what it is. */
export class PostReadinessUpdateDto {
  @ApiProperty({ enum: ReadinessStatus })
  @IsEnum(ReadinessStatus)
  status!: ReadinessStatus;

  @ApiPropertyOptional({ description: 'Required for a blocker: what is wrong and what you need' })
  @IsOptional() @IsString() @MaxLength(2000)
  note?: string;
}
