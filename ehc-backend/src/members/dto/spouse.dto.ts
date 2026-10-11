import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SpouseRequestDto {
  @ApiProperty({ description: 'The member being asked to confirm they are my spouse' })
  @IsString()
  @MaxLength(64)
  memberId!: string;
}
