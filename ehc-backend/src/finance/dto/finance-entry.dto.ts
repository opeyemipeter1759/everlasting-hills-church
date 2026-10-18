import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const KINDS = ['INCOME', 'EXPENSE'] as const;

export class CreateFinanceEntryDto {
  @ApiProperty({ enum: KINDS, example: 'INCOME' })
  @IsIn(KINDS)
  kind!: (typeof KINDS)[number];

  @ApiProperty({ example: 'Building', description: 'Free text — Building, Program, Rent, Giving for income; whatever fits for an expense' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category!: string;

  @ApiPropertyOptional({ example: 'Youth Conference 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string;

  @ApiProperty({ example: 50000, description: 'Naira, whole amount' })
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  amount!: number;

  @ApiProperty({ example: '2026-10-15', description: 'The date this income/expense is attributed to' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: 'Paid via bank transfer' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateFinanceEntryDto {
  @ApiPropertyOptional({ example: 'Building' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ example: 'Youth Conference 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  amount?: number;

  @ApiPropertyOptional({ example: '2026-10-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Paid via bank transfer' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
