import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FollowUpReportSentVia } from '@prisma/client';
import { ArrayMinSize, ArrayUnique, IsArray, IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class SendServiceReportDto {
  @ApiProperty({ example: 'Followed up with 6 first-timers today...' })
  @IsString()
  @MinLength(1)
  summaryText!: string;

  @ApiPropertyOptional({ enum: FollowUpReportSentVia, default: FollowUpReportSentVia.BOTH })
  @IsOptional()
  @IsEnum(FollowUpReportSentVia)
  sentVia?: FollowUpReportSentVia;

  @ApiPropertyOptional({
    type: [String],
    enum: ['PASTOR', 'ADMIN_HEAD'],
    description: 'Who to notify. Omit to send to both (default).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(['PASTOR', 'ADMIN_HEAD'], { each: true })
  recipients?: ('PASTOR' | 'ADMIN_HEAD')[];
}
