import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class PublishAnnouncementDto {
  @ApiPropertyOptional({
    example: false,
    description:
      'Whether to email members as part of this publish. Omit to keep whatever the announcement was saved with. Publishing an announcement that was unpublished emails everyone a second time unless this is false.',
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
