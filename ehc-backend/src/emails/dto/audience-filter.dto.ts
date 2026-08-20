import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsEnum, IsIn, IsString, ValidateIf } from 'class-validator';

export type AudienceMode = 'ALL' | 'UNIT' | 'ROLE' | 'SPECIFIC';

export class AudienceFilterDto {
  @ApiProperty({ enum: ['ALL', 'UNIT', 'ROLE', 'SPECIFIC'] })
  @IsIn(['ALL', 'UNIT', 'ROLE', 'SPECIFIC'])
  mode!: AudienceMode;

  @ApiPropertyOptional({ description: 'Required when mode is UNIT' })
  @ValidateIf((o) => o.mode === 'UNIT')
  @IsString()
  unitId?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Required when mode is ROLE' })
  @ValidateIf((o) => o.mode === 'ROLE')
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ type: [String], description: 'Member ids — required when mode is SPECIFIC' })
  @ValidateIf((o) => o.mode === 'SPECIFIC')
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  memberIds?: string[];
}
