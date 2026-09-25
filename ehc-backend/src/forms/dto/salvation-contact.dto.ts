import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Pastoral follow-up state on a decision. */
export class SalvationContactDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  contacted!: boolean;

  @ApiPropertyOptional({ example: 'Called Tuesday, joining the 6am watch.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
