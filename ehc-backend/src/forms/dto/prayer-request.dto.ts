import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PrayerRequestDto {
  @ApiProperty({ example: 'Please pray for my family and my job.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  request!: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiProperty({ example: '+1 (555) 123-4567', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;
}
