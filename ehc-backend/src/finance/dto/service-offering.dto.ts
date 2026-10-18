import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpsertServiceOfferingDto {
  @ApiProperty({ example: 150000, description: 'Naira, whole amount' })
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  tithe!: number;

  @ApiProperty({ example: 85000, description: 'Naira, whole amount' })
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  offering!: number;

  @ApiPropertyOptional({ example: 'Counted by two ushers after service' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
