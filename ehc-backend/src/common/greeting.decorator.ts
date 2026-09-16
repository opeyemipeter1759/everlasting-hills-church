import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { MAX_GREETING_LENGTH } from '../notifications/templates/layout';

/**
 * Optional per-email salutation field shared by every DTO that produces an
 * email (blast sends, templates, announcements, the church-wide setting).
 * `null` means "use the church default"; the word lands inside the HTML body,
 * so tags and template braces are refused.
 */
export function IsGreetingField(description = 'Salutation that opens this email, e.g. "Dear" → "Dear Daphne,". Null/omitted = the church-wide default.') {
  return applyDecorators(
    ApiPropertyOptional({ description, nullable: true, maxLength: MAX_GREETING_LENGTH, example: 'Dear' }),
    IsOptional(),
    ValidateIf((o) => o.greeting !== null),
    IsString(),
    MaxLength(MAX_GREETING_LENGTH),
    Matches(/^[^<>{}]*$/, { message: 'greeting cannot contain < > { or }' }),
  );
}
