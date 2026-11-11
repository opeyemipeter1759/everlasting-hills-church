import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, MaxLength } from 'class-validator';

/** A unit's inspection checklists for Sunday and Wednesday, saved as a whole. */
export class UpdateReadinessUnitDto {
  @ApiProperty({ type: [String], example: ['Cameras charged and mounted', 'Stream key tested'] })
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  sundayChecklist!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  wednesdayChecklist!: string[];
}
