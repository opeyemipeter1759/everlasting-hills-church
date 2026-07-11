import { ApiPropertyOptional } from '@nestjs/swagger';
import { RepairStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class UpdateRepairDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) resolution?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) cost?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(140) performedBy?: string;

  @ApiPropertyOptional({ enum: RepairStatus })
  @IsOptional()
  @IsEnum(RepairStatus)
  status?: RepairStatus;
}
