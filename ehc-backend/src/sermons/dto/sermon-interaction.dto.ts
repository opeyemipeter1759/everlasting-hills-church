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

export class CreateCommentDto {
  @ApiProperty({ example: 'This message really spoke to me today.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;

  @ApiProperty({ example: 'comment-id-123', required: false, description: 'Set to reply to another comment.' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class DiscussionResponseDto {
  @ApiProperty({ example: 'I want to start applying this by praying daily.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}

export const DIRECT_MESSAGE_TYPES = ['NOTE', 'QUESTION'] as const;
export type DirectMessageType = (typeof DIRECT_MESSAGE_TYPES)[number];

export class SendDirectMessageDto {
  @ApiProperty({ example: 'member-id-123', description: 'The member this note/question is addressed to.' })
  @IsString()
  @IsNotEmpty()
  recipientMemberId!: string;

  @ApiProperty({ example: 'QUESTION', enum: DIRECT_MESSAGE_TYPES })
  @IsString()
  @IsIn(DIRECT_MESSAGE_TYPES as unknown as string[])
  type!: DirectMessageType;

  @ApiProperty({ example: 'What did you mean by "living sacrifice"?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;

  @ApiProperty({ example: 'message-id-123', required: false, description: 'Set to reply within an existing thread.' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
