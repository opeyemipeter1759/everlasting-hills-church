import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class WhatsappCommunityDto {
  @ApiProperty({
    description: 'True once this person has been added to the WhatsApp community',
  })
  @IsBoolean()
  added!: boolean;
}
