import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class MarkPresentDto {
  @ApiProperty({ description: 'The service to mark this person present for' })
  @IsString()
  @MinLength(1)
  serviceId!: string;
}
