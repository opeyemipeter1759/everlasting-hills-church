import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export const REACTION_TYPES = ['LIKE', 'AMEN', 'CONVICTED'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export class ReactionDto {
  @ApiProperty({ example: 'LIKE', enum: REACTION_TYPES })
  @IsString()
  @IsIn(REACTION_TYPES as unknown as string[])
  type!: ReactionType;
}

export class NoteDto {
  @ApiProperty({ example: 'My sermon note' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}

export class ProgressDto {
  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(0)
  positionSec!: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
