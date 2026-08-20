import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBirthdayGreetingDto {
  @ApiProperty({ example: 'Happy birthday! Praying for a wonderful year ahead 🎉' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;
}
