import { ApiPropertyOptional } from '@nestjs/swagger';
import { GiftEntryStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListGiftEntriesQueryDto {
  @ApiPropertyOptional({ enum: GiftEntryStatus, description: 'Only entries with this status' })
  @IsOptional()
  @IsEnum(GiftEntryStatus)
  status?: GiftEntryStatus;
}

export class RejectGiftEntryDto {
  @ApiPropertyOptional({ maxLength: 300, description: 'Why the entry was rejected; shown to the member' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
