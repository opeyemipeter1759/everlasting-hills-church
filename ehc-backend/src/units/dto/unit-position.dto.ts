import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUnitPositionDto {
  @ApiProperty({ example: 'Secretary' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;
}

export class UpdateUnitPositionDto {
  @ApiProperty({ example: 'Treasurer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;
}

export class SetMemberPositionDto {
  @ApiProperty({ example: 'position-uuid', required: false, description: 'null clears the position' })
  @IsOptional()
  @IsString()
  positionId?: string | null;
}
