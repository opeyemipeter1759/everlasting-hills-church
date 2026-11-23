import { ApiPropertyOptional } from '@nestjs/swagger';
import { GiftEntryStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum GiftActivity {
  GIFT_EXCHANGE = 'GIFT_EXCHANGE',
  PICNIC = 'PICNIC',
}

export class ListGiftEntriesQueryDto {
  @ApiPropertyOptional({ enum: GiftEntryStatus, description: 'Only entries with this status' })
  @IsOptional()
  @IsEnum(GiftEntryStatus)
  status?: GiftEntryStatus;

  @ApiPropertyOptional({ enum: GiftActivity, description: 'Only members who chose this activity' })
  @IsOptional()
  @IsEnum(GiftActivity)
  activity?: GiftActivity;
}

export class RejectGiftEntryDto {
  @ApiPropertyOptional({ maxLength: 300, description: 'Why the entry was rejected; shown to the member' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
