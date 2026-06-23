import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ServiceType } from '@prisma/client';

/** Body for creating a service session (ADMIN). */
export class CreateServiceDto {
  @ApiProperty({ example: 'Sunday Service — 22 June 2026' })
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  name!: string;

  @ApiProperty({ example: '2026-06-22T09:00:00.000Z' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ enum: ServiceType, example: ServiceType.SUNDAY })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;
}
