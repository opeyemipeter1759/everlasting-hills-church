import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ShareReadingPlanDto {
  @ApiPropertyOptional({
    maxLength: 500,
    description: 'A short note from the admin, shown above the plan in the notification and email.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Also email every active member who has an address on file.',
  })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

export class ShareReadingPlanResultDto {
  @ApiProperty({ description: 'The announcement that records the share' })
  announcementId!: string;

  @ApiProperty({ description: 'How many members were sent an in-app notification' })
  recipients!: number;
}
