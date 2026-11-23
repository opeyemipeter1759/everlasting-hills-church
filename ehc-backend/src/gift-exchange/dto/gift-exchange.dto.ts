import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** What a member wants to join. At least one must be true (checked in the service). */
export class GiftExchangeChoiceDto {
  @ApiProperty({ description: 'Take part in the gift exchange' })
  @IsBoolean()
  giftExchange!: boolean;

  @ApiProperty({ description: 'Come to the picnic' })
  @IsBoolean()
  picnic!: boolean;
}
