import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateUnitExpenseDto {
  @ApiProperty({ example: 'Cleaning supplies' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title!: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ required: false, example: 'Supplies' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsISO8601()
  date!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false, description: 'URL from POST /uploads/document' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

export class UpdateUnitExpenseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601()
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiptUrl?: string;
}
