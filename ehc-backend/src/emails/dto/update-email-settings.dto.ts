import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches, MaxLength, ValidateIf } from 'class-validator';
import { MAX_GREETING_LENGTH } from '../../notifications/templates/layout';

/** Partial update: only the fields present are changed. */
export class UpdateEmailSettingsDto {
  @ApiPropertyOptional({ description: 'Public URL of the header logo (from /uploads/image). Null restores the default site logo.', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.logoUrl !== null)
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  logoUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Salutation that opens every email, e.g. "Dear" → "Dear Daphne,". Null restores the default ("Hello").',
    nullable: true,
    maxLength: MAX_GREETING_LENGTH,
    example: 'Dear',
  })
  @IsOptional()
  @ValidateIf((o) => o.greeting !== null)
  @IsString()
  @MaxLength(MAX_GREETING_LENGTH)
  // Plain words only — it lands inside the HTML body, so no tags or braces.
  @Matches(/^[^<>{}]*$/, { message: 'greeting cannot contain < > { or }' })
  greeting?: string | null;
}
