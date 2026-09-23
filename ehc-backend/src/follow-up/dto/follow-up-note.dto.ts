import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddFollowUpNoteDto {
  @ApiProperty({ maxLength: 4000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;

  @ApiProperty({ required: false, description: 'The message this answers, when it is a reply.' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class ReactToNoteDto {
  @ApiProperty({ description: 'A single emoji.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  emoji!: string;
}

export class EditFollowUpNoteDto extends AddFollowUpNoteDto {}
