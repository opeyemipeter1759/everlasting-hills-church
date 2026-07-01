import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Assign one or more members to a care/discipleship leader (People console). */
export class CreateAssignmentDto {
  @ApiProperty({ type: [String], description: 'Member ids to assign' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  memberIds!: string[];

  @ApiProperty({ description: 'Member id of the leader who will shepherd them' })
  @IsString()
  leaderId!: string;

  @ApiPropertyOptional({ example: 'New convert — weekly follow-up' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
