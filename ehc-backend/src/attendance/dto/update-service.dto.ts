import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ServiceType } from '@prisma/client';

/** Body for editing an existing service session (ADMIN). */
export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Sunday Service — 22 June 2026' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  name?: string;

  @ApiPropertyOptional({ example: '2026-06-22T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ enum: ServiceType, example: ServiceType.SUNDAY })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;
}
