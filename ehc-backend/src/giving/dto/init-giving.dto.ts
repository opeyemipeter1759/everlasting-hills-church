import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Body for POST /giving/initialize. Amount is in major units (Naira); the
 * service converts to kobo for Paystack.
 */
export class InitGivingDto {
  @ApiProperty({ example: 5000, description: 'Amount in Naira (major units)' })
  @IsInt()
  @Min(100, { message: 'Minimum gift is ₦100' })
  amount!: number;

  @ApiProperty({ example: 'donor@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Tithe', description: 'Designation / fund' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;
}
