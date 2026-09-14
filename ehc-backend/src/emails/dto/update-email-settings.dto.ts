import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateEmailSettingsDto {
  @ApiPropertyOptional({ description: 'Public URL of the header logo (from /uploads/image). Null restores the default site logo.', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.logoUrl !== null)
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  logoUrl?: string | null;
}
