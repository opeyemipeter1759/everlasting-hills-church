import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class InspectionCheckDto {
  @ApiProperty({ example: 'Cameras charged and mounted' })
  @IsString() @MaxLength(200)
  label!: string;

  @ApiProperty()
  @IsBoolean()
  passed!: boolean;

  @ApiPropertyOptional({ example: 'Camera 2 battery at 20%' })
  @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}

/** One department's inspection: each checklist line ticked or not, and an overall note. */
export class SaveInspectionDto {
  @ApiProperty({ type: [InspectionCheckDto] })
  @IsArray() @ArrayMaxSize(40)
  @ValidateNested({ each: true }) @Type(() => InspectionCheckDto)
  checks!: InspectionCheckDto[];

  @ApiPropertyOptional({ description: 'Overall note' })
  @IsOptional() @IsString() @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({ description: 'For a department with no checklist yet: was it ready?' })
  @IsOptional() @IsBoolean()
  ready?: boolean;
}
