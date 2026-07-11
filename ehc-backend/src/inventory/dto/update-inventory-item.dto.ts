import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryCondition, InventoryStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateInventoryItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(140) name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(80) category?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) serialNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(140) location?: string;

  @ApiPropertyOptional({ enum: InventoryStatus })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @ApiPropertyOptional({ enum: InventoryCondition })
  @IsOptional()
  @IsEnum(InventoryCondition)
  condition?: InventoryCondition;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) quantity?: number;

  @ApiPropertyOptional() @IsOptional() @IsDateString() purchaseDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) purchaseValue?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(140) assignedTo?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
