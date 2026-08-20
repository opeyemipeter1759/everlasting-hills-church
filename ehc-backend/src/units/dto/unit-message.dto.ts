import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendUnitMessageDto {
  @ApiProperty({ example: 'member-uuid', description: 'Member.id of the recipient — must be in the same unit' })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @ApiProperty({ example: "Can we get more chairs for Sunday's setup?" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;
}
