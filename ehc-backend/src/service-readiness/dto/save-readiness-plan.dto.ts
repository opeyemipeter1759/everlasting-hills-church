import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** A department's Stage 1 plan, in the order the Administration Manual lists it. */
export class SaveReadinessPlanDto {
  @ApiPropertyOptional({ description: 'Workers assigned and their availability' })
  @IsOptional() @IsString() @MaxLength(2000)
  workers?: string;

  @ApiPropertyOptional({ description: 'Equipment and materials required' })
  @IsOptional() @IsString() @MaxLength(2000)
  equipment?: string;

  @ApiPropertyOptional({ description: 'Preparation already completed' })
  @IsOptional() @IsString() @MaxLength(2000)
  done?: string;

  @ApiPropertyOptional({ description: 'Preparation still outstanding' })
  @IsOptional() @IsString() @MaxLength(2000)
  outstanding?: string;

  @ApiPropertyOptional({ description: 'Anticipated challenges' })
  @IsOptional() @IsString() @MaxLength(2000)
  challenges?: string;

  @ApiPropertyOptional({ description: 'Support required' })
  @IsOptional() @IsString() @MaxLength(2000)
  support?: string;

  @ApiPropertyOptional({ description: 'The unit can meet the ready-by deadline' })
  @IsOptional() @IsBoolean()
  canMeetDeadline?: boolean;
}
