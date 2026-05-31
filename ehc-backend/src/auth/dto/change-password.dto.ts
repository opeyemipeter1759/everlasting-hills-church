import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'newpassword123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'password must be at least 6 characters' })
  password!: string;
}
