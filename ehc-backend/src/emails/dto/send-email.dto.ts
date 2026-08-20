import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { AudienceFilterDto } from './audience-filter.dto';

export class SendEmailDto {
  @ApiPropertyOptional({ description: 'Template this send originated from, for record-keeping only — subject/body below are what actually gets sent' })
  @IsOptional()
  @IsString()
  templateId?: string;

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

  @ApiProperty({ type: AudienceFilterDto })
  @ValidateNested()
  @Type(() => AudienceFilterDto)
  audience!: AudienceFilterDto;
}
