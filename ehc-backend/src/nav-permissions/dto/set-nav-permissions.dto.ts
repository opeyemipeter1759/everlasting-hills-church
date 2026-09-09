import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsEnum, IsString, MinLength, ValidateNested } from 'class-validator';
import { Role } from '@prisma/client';

export class NavPermissionItemDto {
  @IsString()
  @MinLength(1)
  itemHref!: string;

  @IsArray()
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}

export class SetNavPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavPermissionItemDto)
  items!: NavPermissionItemDto[];
}
