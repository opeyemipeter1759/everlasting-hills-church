import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyRecoveryDto {
  @ApiProperty({ description: 'The token_hash from the password-reset link' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  tokenHash!: string;
}
