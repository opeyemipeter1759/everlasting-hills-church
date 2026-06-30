import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMyProfileDto {
  @ApiProperty({ required: false, example: 'Opeyemi' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiProperty({ required: false, example: 'Peter' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string | null;

  @ApiProperty({ required: false, example: '+234 801 234 5678' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(40)
  phone?: string | null;

  @ApiProperty({ required: false, example: 'Husband, dad, and member at EHC.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string | null;

  @ApiProperty({ required: false, enum: ['Male', 'Female'] })
  @IsOptional()
  @IsIn(['Male', 'Female'])
  gender?: string | null;

  @ApiProperty({ required: false, example: '1990-02-18' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiProperty({
    required: false,
    example: '2015-06-20',
    description: 'Pass null to clear it and mark the member as single.',
  })
  @IsOptional()
  @IsDateString()
  weddingAnniversary?: string | null;

  @ApiProperty({ required: false, example: '@opeyemi.peter' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  instagram?: string | null;

  @ApiProperty({ required: false, example: '@opeyemi.peter' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  facebook?: string | null;

  @ApiProperty({ required: false, example: '@opeyemi.peter' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  twitter?: string | null;

  @ApiProperty({ required: false, example: '@opeyemi.peter' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  linkedin?: string | null;

  @ApiProperty({ required: false, example: '@opeyemi.peter' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tiktok?: string | null;
}
