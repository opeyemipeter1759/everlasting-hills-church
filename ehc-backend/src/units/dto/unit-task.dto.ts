import { ApiProperty } from '@nestjs/swagger';
import { UnitTaskStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUnitTaskDto {
  @ApiProperty({ example: 'Set up chairs for Sunday service' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'member-uuid', required: false, description: 'Leave unset for a whole-unit task' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}

export class UpdateUnitTaskDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false, description: 'null clears the assignee' })
  @IsOptional()
  @IsString()
  assignedToId?: string | null;

  @ApiProperty({ enum: UnitTaskStatus, required: false })
  @IsOptional()
  @IsEnum(UnitTaskStatus)
  status?: UnitTaskStatus;

  @ApiProperty({ required: false, description: 'null clears the due date' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string | null;
}
