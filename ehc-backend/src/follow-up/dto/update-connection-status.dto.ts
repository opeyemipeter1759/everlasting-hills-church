import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateConnectionStatusDto {
  @ApiProperty({ enum: ['CONNECTED', 'DECLINED'] })
  @IsIn(['CONNECTED', 'DECLINED'])
  status!: 'CONNECTED' | 'DECLINED';
}
