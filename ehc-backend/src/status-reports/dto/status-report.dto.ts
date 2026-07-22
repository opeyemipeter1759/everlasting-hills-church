import { ApiProperty } from '@nestjs/swagger';
import { ReportScope } from '@prisma/client';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** A create/update caller only ever chooses between these two — NEEDS_CORRECTION
 * and APPROVED are review-side transitions (request-correction / approve routes),
 * never set directly by the author. */
const WRITABLE_STATUSES = ['DRAFT', 'SUBMITTED'] as const;
export type WritableReportStatus = (typeof WRITABLE_STATUSES)[number];

export class CreateReportDto {
  @ApiProperty({ enum: ReportScope, example: 'UNIT' })
  @IsEnum(ReportScope)
  scope!: ReportScope;

  @ApiProperty({ required: false, description: 'Required when scope = DEPARTMENT' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ required: false, description: 'Required when scope = UNIT' })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiProperty({ example: 'Weekly update — July 14' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'This week we had 3 new visitors join the unit...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20_000)
  content!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachmentName?: string;

  @ApiProperty({ required: false, enum: WRITABLE_STATUSES, description: 'Omit to send immediately (back-compat); DRAFT to save without sending' })
  @IsOptional()
  @IsIn(WRITABLE_STATUSES)
  status?: WritableReportStatus;
}

export class UpdateReportDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20_000)
  content!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachmentName?: string;

  @ApiProperty({ required: false, enum: WRITABLE_STATUSES, description: 'DRAFT to keep saving as a draft; SUBMITTED to send (from DRAFT or after a correction). Omit to preserve current resubmit/plain-edit behavior.' })
  @IsOptional()
  @IsIn(WRITABLE_STATUSES)
  status?: WritableReportStatus;
}

export class RequestCorrectionDto {
  @ApiProperty({ example: 'Please add attendance numbers for each service.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(4000)
  comment!: string;
}

export class AddCommentDto {
  @ApiProperty({ example: 'Thanks — updated with attendance numbers.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}
