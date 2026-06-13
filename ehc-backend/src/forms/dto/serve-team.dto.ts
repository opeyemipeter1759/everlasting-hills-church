import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ServeTeamDto {
  @ApiProperty({ example: 'Tunde Adeyemi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'tunde@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '+2348012345678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ example: 'Worship Team' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  unit!: string;

  @ApiProperty({ example: 'I play guitar and have experience in worship.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
