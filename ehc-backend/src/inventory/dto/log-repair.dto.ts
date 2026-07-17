import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepairStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MaxLength, MinLength } from 'class-validator';

export class LogRepairDto {
  @ApiProperty({ example: 'Compressor stopped cooling' })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({ example: 'Replaced compressor and refilled refrigerant' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;

  @ApiPropertyOptional({ example: 35000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 'CoolFix Technicians' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  performedBy?: string;

  @ApiProperty({ enum: RepairStatus, default: RepairStatus.PENDING })
  @IsEnum(RepairStatus)
  status!: RepairStatus;
}
