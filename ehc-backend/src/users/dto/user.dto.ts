import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Allowed roles when creating/updating a user. VISITOR isn't manageable here
 * (visitors come in via the public first-timer form, not admin creation).
 */
const MANAGEABLE_ROLES = [
  Role.MEMBER,
  Role.UNIT_LEAD,
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
