import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** A payment the pledger has made towards an installment pledge. */
export class PledgeInstallmentDto {
  @ApiProperty({ example: 25000, description: 'Amount given in whole naira' })
  @IsInt({ message: 'Enter the amount in whole naira' })
  @Min(1)
  @Max(10_000_000_000)
  amount!: number;

  @ApiProperty({ example: '2026-09-15', description: 'Date the installment was given' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Enter the date as YYYY-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'Enter a valid installment date' })
  givenOn!: string;

  @ApiPropertyOptional({ example: 'Bank transfer', description: 'Optional reminder for the pledger' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  note?: string;
}
