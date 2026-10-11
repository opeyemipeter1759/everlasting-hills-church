import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

const URGENCIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
const WELFARE_STATUSES = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'DECLINED'] as const;

export class WelfareRequestDto {
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

  @ApiProperty({ example: true, description: 'Whether the submitter serves in a unit/department at the church' })
  @IsBoolean()
  isWorkerInChurch!: boolean;

  @ApiProperty({ example: 'Bodija, Ibadan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;

  @ApiProperty({ example: 'About 2 years' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  attendanceLength!: string;

  @ApiProperty({ example: 'Tailor', description: 'What they do for a living' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  occupation!: string;

  @ApiProperty({ example: 'Help with rent', description: 'What they need help with, in their own words' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  category!: string;

  @ApiProperty({ example: 'I was given a quit notice and need help covering rent for one more month.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  description!: string;

  @ApiProperty({ enum: URGENCIES, example: 'MEDIUM' })
  @IsIn(URGENCIES)
  urgency!: (typeof URGENCIES)[number];
}

export class UpdateWelfareRequestStatusDto {
  @ApiProperty({ enum: WELFARE_STATUSES, example: 'IN_REVIEW' })
  @IsIn(WELFARE_STATUSES)
  status!: (typeof WELFARE_STATUSES)[number];
}
