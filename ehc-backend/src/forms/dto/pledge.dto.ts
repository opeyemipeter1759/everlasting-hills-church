import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const PLEDGE_METHODS = ['ONE_TIME', 'WEEKLY', 'MONTHLY', 'OTHER'] as const;
export type PledgeMethod = (typeof PLEDGE_METHODS)[number];

/** A member's pledge towards a church project, in naira. */
export class PledgeDto {
  @ApiProperty({ example: 'Tomike Kolajo' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: '0810 235 5043', description: 'WhatsApp number' })
  @IsString()
  @Matches(/^\+?[0-9][0-9 ()-]{6,19}$/, {
    message: 'Enter a phone number, for example 0810 235 5043',
  })
  phone!: string;

  @ApiProperty({ example: 'tomike@example.com' })
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(160)
  email!: string;

  @ApiProperty({ example: 250000, description: 'The whole pledge in naira' })
  @IsInt({ message: 'Enter the amount in whole naira' })
  @Min(1)
  @Max(10_000_000_000)
  amount!: number;

  @ApiProperty({ enum: PLEDGE_METHODS })
  @IsIn(PLEDGE_METHODS)
  method!: PledgeMethod;

  @ApiPropertyOptional({ description: 'How they will redeem it, when method is OTHER' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  methodOther?: string;

  @ApiPropertyOptional({ example: 25000, description: 'Per installment, for weekly or monthly' })
  @IsOptional()
  @IsInt({ message: 'Enter the installment in whole naira' })
  @Min(1)
  installmentAmount?: number;

  @ApiProperty({ example: '2026-12-31', description: 'Expected date to complete the pledge' })
  @IsISO8601({ strict: true })
  completeBy!: string;

  @ApiProperty({ description: 'Whether the project team may contact them about the pledge' })
  @IsBoolean()
  contactMe!: boolean;

  @ApiProperty({ description: 'The pledge confirmation, which must be ticked' })
  @Equals(true, { message: 'Please tick the pledge confirmation' })
  confirmed!: boolean;
}
