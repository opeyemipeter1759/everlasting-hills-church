import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const REPORT_SCOPES = ['UNIT', 'DEPARTMENT', 'CHURCH'] as const;
type ReportScope = typeof REPORT_SCOPES[number];

export class CreateReportDto {
  @ApiProperty({ enum: REPORT_SCOPES, example: 'UNIT' })
  @IsIn(REPORT_SCOPES)
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
  @MaxLength(10_000)
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
  @MaxLength(10_000)
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
