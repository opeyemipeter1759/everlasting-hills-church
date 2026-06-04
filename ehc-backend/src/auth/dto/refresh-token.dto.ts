import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The Supabase refresh token issued at login.' })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
