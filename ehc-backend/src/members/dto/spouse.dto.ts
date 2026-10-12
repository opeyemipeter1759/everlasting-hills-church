import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SpouseRequestDto {
  @ApiProperty({ description: 'The member being asked to confirm they are my spouse' })
  @IsString()
  @MaxLength(64)
  memberId!: string;
}

export class ProfileCommentDto {
  @ApiProperty({ description: 'A word of encouragement, up to 500 characters' })
  @IsString()
  @MaxLength(500)
  body!: string;
}
