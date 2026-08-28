import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/** Moves a whole caseload from one team member to another within one unit —
 * e.g. when someone goes on leave. */
export class BulkReassignDto {
  @ApiProperty()
  @IsString()
  unitId!: string;

  @ApiProperty()
  @IsString()
  fromAssigneeId!: string;

  @ApiProperty()
  @IsString()
  toAssigneeId!: string;
}
