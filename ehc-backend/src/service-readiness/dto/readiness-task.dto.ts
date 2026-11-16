import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** One or more tasks to add to a unit's plan (several at once when copying last service's list). */
export class AddReadinessTasksDto {
  @ApiProperty({ type: [String], example: ['Test the wireless mics', 'Charge camera batteries'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  titles!: string[];
}

/** Tick a task off (or back on), or rename it. */
export class UpdateReadinessTaskDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  done?: boolean;
}
