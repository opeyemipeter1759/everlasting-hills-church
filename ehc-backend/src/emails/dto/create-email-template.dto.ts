import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEmailTemplateDto {
  @ApiProperty({ example: 'Monthly Newsletter' })
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name!: string;

  @ApiProperty({ example: 'Here is what happened this month at EHC' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ example: '<p>Dear church family,</p>' })
  @IsString()
  @MinLength(2)
  @MaxLength(20_000)
  body!: string;
}
