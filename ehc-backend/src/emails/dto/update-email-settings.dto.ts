import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl, MaxLength, ValidateIf } from 'class-validator';
import { IsGreetingField } from '../../common/greeting.decorator';

/** Partial update: only the fields present are changed. */
export class UpdateEmailSettingsDto {
  @ApiPropertyOptional({ description: 'Public URL of the header logo (from /uploads/image). Null restores the default site logo.', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.logoUrl !== null)
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  logoUrl?: string | null;

  @IsGreetingField('Church-wide default salutation, e.g. "Dear" → "Dear Daphne,". Null restores "Hello". Individual emails can override it.')
  greeting?: string | null;
}
