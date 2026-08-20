import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateEmailTemplateDto {
  @ApiPropertyOptional({ example: 'Monthly Newsletter' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  name?: string;

  @ApiPropertyOptional({ example: 'Here is what happened this month at EHC' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject?: string;

  @ApiPropertyOptional({ example: '<p>Dear church family,</p>' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20_000)
  body?: string;
}
