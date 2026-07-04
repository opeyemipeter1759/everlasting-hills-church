import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Allowed roles when creating/updating a user. VISITOR isn't manageable here
 * (visitors come in via the public first-timer form, not admin creation).
 */
const MANAGEABLE_ROLES = [
  Role.MEMBER,
  Role.UNIT_LEAD,
  Role.HEAD_USHER,
  Role.ADMIN,
  Role.PASTOR,
  Role.SUPER_ADMIN,
] as const;

export class CreateUserDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: '+2348012345678', description: 'Used as initial password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Phone (initial password) must be at least 6 characters' })
  @MaxLength(40)
  phone!: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({ example: 'MEMBER', enum: MANAGEABLE_ROLES })
  @IsEnum(MANAGEABLE_ROLES)
  role!: (typeof MANAGEABLE_ROLES)[number];

  @ApiProperty({ required: false, enum: ['MALE', 'FEMALE'] })
  @IsOptional()
  @IsIn(['MALE', 'FEMALE'])
  gender?: 'MALE' | 'FEMALE';
}

/** Create one or many people in a single submission (People console). */
export class BulkCreateUsersDto {
  @ApiProperty({ type: [CreateUserDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  members!: CreateUserDto[];
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'ADMIN', enum: MANAGEABLE_ROLES })
  @IsEnum(MANAGEABLE_ROLES)
  role!: (typeof MANAGEABLE_ROLES)[number];
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}
