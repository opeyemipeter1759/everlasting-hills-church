import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalvationDecisionType } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * A decision for Christ, submitted from the public site.
 *
 * Only the name and the decision itself are required. Somebody responding in
 * the moment should not be turned away by a form — everything the church would
 * like to know is optional, and the pastoral team follows up with whatever
 * contact detail was given.
 */
export class SalvationDecisionDto {
  @ApiProperty({ example: 'Grace' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  first_name!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  last_name!: string;

  @ApiProperty({ enum: SalvationDecisionType, example: SalvationDecisionType.FIRST_TIME })
  @IsEnum(SalvationDecisionType)
  decision!: SalvationDecisionType;

  @ApiPropertyOptional({ example: 'grace@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: '+234 801 234 5678' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'Ibadan, Oyo State, Nigeria' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 'Everlasting Hills Church', description: 'Blank when they have no church yet' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  church_name?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  interested_in_baptism?: boolean;

  @ApiPropertyOptional({ example: 'I came back to the Lord during Furnace.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ example: 'furnace-2026', description: 'Slug of the event this came from' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  event_slug?: string;
}
