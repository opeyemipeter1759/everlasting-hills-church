import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Yamaha Keyboard' })
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name!: string;

  @ApiProperty({ example: 'Musical Instruments' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category!: string;

  @ApiPropertyOptional({ example: 'YMH-2024-001' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  serialNumber?: string;

  @ApiPropertyOptional({ example: 'Main Auditorium' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  location?: string;

  @ApiPropertyOptional({ enum: InventoryStatus, default: InventoryStatus.IN_USE })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @ApiPropertyOptional({ enum: InventoryCondition, default: InventoryCondition.NEW })
  @IsOptional()
  @IsEnum(InventoryCondition)
  condition?: InventoryCondition;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 450000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseValue?: number;

  @ApiPropertyOptional({ example: 'Media Department' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    example: 'Gospel Music Store',
    description: 'Vendor/supplier — recorded on the initial "New" history entry only',
  })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  vendor?: string;
}
