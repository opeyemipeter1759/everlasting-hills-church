import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { NavGrantAccess, NavGrantType } from '@prisma/client';

/**
 * `targetId` is polymorphic by `type`: a Profile.id for MEMBER, a Unit.id for
 * UNIT_MEMBER/UNIT_LEAD. The service validates the referenced row actually
 * exists before writing — this DTO only checks shape.
 */
export class CreateNavGrantDto {
  @IsString()
  @MinLength(1)
  itemHref!: string;

  @IsEnum(NavGrantType)
  type!: NavGrantType;

  @IsString()
  @MinLength(1)
  targetId!: string;

  /** VIEW = read only; FULL (default) = everything on the page. */
  @IsOptional()
  @IsEnum(NavGrantAccess)
  access?: NavGrantAccess;
}

export class UpdateNavGrantDto {
  @IsEnum(NavGrantAccess)
  access!: NavGrantAccess;
}
