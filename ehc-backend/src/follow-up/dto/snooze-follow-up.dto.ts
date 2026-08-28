import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

/** Pass a future ISO date to snooze; omit (or a past date) to un-snooze. */
export class SnoozeFollowUpDto {
  @ApiPropertyOptional({ example: '2026-09-04T09:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  until?: string | null;
}
