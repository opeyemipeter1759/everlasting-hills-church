import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ImportRowDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+2348012345678', description: 'Used as the initial password' })
  @IsString()
  @MaxLength(40)
  phone!: string;

  @ApiPropertyOptional({ type: [String], example: ['choir', 'usher'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Doe Family' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  household?: string;
}

export class BulkImportDto {
  @ApiProperty({ type: [ImportRowDto] })
  @IsArray()
  @ArrayMaxSize(500, { message: 'Import at most 500 rows at a time' })
  @ValidateNested({ each: true })
  @Type(() => ImportRowDto)
  rows!: ImportRowDto[];

  @ApiPropertyOptional({
    example: false,
    description: 'Send each imported member a welcome email with login details',
  })
  @IsOptional()
  @IsBoolean()
  sendWelcome?: boolean;
}
