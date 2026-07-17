import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignFollowUpDto {
  @ApiProperty({ description: 'Member id of the team member to assign' })
  @IsString()
  assigneeId!: string;
}
