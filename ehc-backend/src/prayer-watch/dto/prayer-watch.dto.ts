import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreatePrayerSignupDto {
  @ApiProperty({ example: 'slot-id' })
  @IsString()
  @IsNotEmpty()
  slotId!: string;

  @ApiProperty({ example: 'Adaeze Okafor' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: '+234 801 234 5678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @ApiProperty({ example: 'adaeze@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: true, description: 'true = worker/serves in a unit or department, false = member only' })
  @IsBoolean()
  isWorker!: boolean;
}

/** Admin-only: add someone without them having filled the public form. */
export class AdminCreatePrayerSignupDto extends CreatePrayerSignupDto {}

export class MovePrayerSignupDto {
  @ApiProperty({ example: 'slot-id' })
  @IsString()
  @IsNotEmpty()
  slotId!: string;
}

export class SetSlotLeaderDto {
  @ApiPropertyOptional({ example: 'signup-id', description: 'The sign-up to make leader, or null to clear', nullable: true })
  @IsOptional()
  @IsString()
  signupId?: string | null;
}

class SlotSettingDto {
  @ApiProperty({ example: 'slot-id' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(100)
  capacity!: number;
}

export class UpdatePrayerWatchDto {
  @ApiPropertyOptional({ example: 'Night Watch 2026' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  watchDate?: string;

  @ApiPropertyOptional({ type: [SlotSettingDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => SlotSettingDto)
  slots?: SlotSettingDto[];
}

const REMOVAL_STATUS = ['REMOVED'] as const;

export class UpdatePrayerSignupStatusDto {
  @ApiProperty({ enum: REMOVAL_STATUS, example: 'REMOVED' })
  @IsIn(REMOVAL_STATUS)
  status!: (typeof REMOVAL_STATUS)[number];
}
