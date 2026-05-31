import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
}
