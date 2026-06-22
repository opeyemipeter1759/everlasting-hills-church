import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 'Hospitality' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'Front-door welcome team', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;
}

export class UpdateUnitDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;
}

export class AssignUnitMemberDto {
  @ApiProperty({ example: 'member-uuid' })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ example: false, required: false, description: 'Make this member the unit lead' })
  @IsOptional()
  @IsBoolean()
  isLead?: boolean;

  @ApiProperty({ example: false, required: false, description: 'Make this member an assistant' })
  @IsOptional()
  @IsBoolean()
  isAssistant?: boolean;
}

export class SetMemberRoleDto {
  @ApiProperty({ example: false, required: false, description: 'Set lead status' })
  @IsOptional()
  @IsBoolean()
  isLead?: boolean;

  @ApiProperty({ example: true, required: false, description: 'Set assistant status' })
  @IsOptional()
  @IsBoolean()
  isAssistant?: boolean;
}
