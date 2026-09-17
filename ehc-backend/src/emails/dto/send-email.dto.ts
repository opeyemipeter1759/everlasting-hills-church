import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { AudienceFilterDto } from './audience-filter.dto';
import { IsGreetingField } from '../../common/greeting.decorator';

export class EmailAttachmentDto {
  @ApiProperty({ example: 'flyer.png' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Public URL of the uploaded file (from /uploads/image or /uploads/document)' })
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  url!: string;
}

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

  @IsGreetingField()
  greeting?: string | null;

  @ApiProperty({ type: AudienceFilterDto })
  @ValidateNested()
  @Type(() => AudienceFilterDto)
  audience!: AudienceFilterDto;

  @ApiPropertyOptional({ type: [EmailAttachmentDto], description: 'Up to 5 files to attach' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
}
