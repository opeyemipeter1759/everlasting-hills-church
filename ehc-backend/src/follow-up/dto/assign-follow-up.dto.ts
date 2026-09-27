import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AssignFollowUpDto {
  @ApiProperty({ description: 'Member id of the team member to assign' })
  @IsString()
  assigneeId!: string;

  @ApiProperty({
    required: false,
    enum: ['FOLLOW_UP', 'INTEGRATION'],
    description: "Whose assignment this is. INTEGRATION sets the Integration Team's own assignee and leaves Follow Up's alone. Default FOLLOW_UP.",
  })
  @IsOptional()
  @IsIn(['FOLLOW_UP', 'INTEGRATION'])
  team?: 'FOLLOW_UP' | 'INTEGRATION';
}
