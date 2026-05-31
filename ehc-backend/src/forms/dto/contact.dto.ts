import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ContactDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '+234...', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ example: 'Question', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  subject?: string;

  @ApiProperty({ example: 'I would like to know more about...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  message!: string;
}
