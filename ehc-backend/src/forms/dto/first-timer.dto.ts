import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class FirstTimerDto {
  @ApiProperty({ example: 'Freya' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  first_name!: string;

  @ApiProperty({ example: 'Hall' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  last_name!: string;

  @ApiProperty({ example: '+1 (644) 543-9874' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone_number!: string;

  @ApiProperty({ example: 'jimeqaquh@mailinator.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiProperty({ example: 'Female', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @ApiProperty({ example: 'Online', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  attendance_type?: string;

  @ApiProperty({ example: 'Social Media', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  how_did_you_learn?: string;

  @ApiProperty({ example: '', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  invited_by?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  located_in_ibadan?: boolean;

  @ApiProperty({ example: 'Maybe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  membership_interest?: string;

  @ApiProperty({ example: 'Dignissimos et eos u', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ example: 'Eos aspernatur quam', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;

  @ApiProperty({ example: 'No', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  born_again?: string;

  @ApiProperty({ example: 'In placeat nostrum ', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  service_experience?: string;

  @ApiProperty({ example: 'Mollitia esse invent', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prayer_point?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  whatsapp_interest?: boolean;

  @ApiProperty({ example: '27', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  birth_day?: string;

  @ApiProperty({ example: 'June', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  birth_month?: string;

  @ApiProperty({ example: 'FIRST_TIMER', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  type?: string;
}
