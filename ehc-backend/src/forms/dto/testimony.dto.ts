import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class TestimonyDto {
  @ApiProperty({ example: 'God answered my prayer', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ example: 'God healed me after the Sunday service.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  testimony!: string;

  @ApiProperty({ example: 'Jane Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: 'jane@example.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiProperty({ example: '+1 (555) 987-6543', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ example: false, required: false, description: 'Submitter wants this testimony kept anonymous' })
  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Submitter is willing to share this testimony physically/in-person at a service' })
  @IsOptional()
  @IsBoolean()
  share_physically?: boolean;
}
