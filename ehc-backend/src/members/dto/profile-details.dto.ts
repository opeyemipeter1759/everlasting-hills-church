import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const VIS = ['MEMBERS', 'PRIVATE'] as const;
type Vis = (typeof VIS)[number];
const THIS_YEAR = new Date().getUTCFullYear() + 1;

/** One thing a member does: "CEO" at "sparkpayhq", maybe with a link. */
export class ProfileRoleDto {
  @ApiPropertyOptional({ example: 'CEO' }) @IsString() @MaxLength(60) title!: string;
  @ApiPropertyOptional({ example: 'sparkpayhq', description: 'Where, written as a handle or a name' }) @IsOptional() @IsString() @MaxLength(60) org?: string | null;
  @ApiPropertyOptional({ example: 'https://sparkpay.co' }) @IsOptional() @IsString() @MaxLength(200) url?: string | null;
}

export class ProfileVisibilityDto {
  @ApiPropertyOptional({ enum: VIS }) @IsOptional() @IsIn(VIS) profile?: Vis;
  @ApiPropertyOptional({ enum: VIS }) @IsOptional() @IsIn(VIS) career?: Vis;
  @ApiPropertyOptional({ enum: VIS }) @IsOptional() @IsIn(VIS) testimony?: Vis;
  @ApiPropertyOptional({ enum: VIS }) @IsOptional() @IsIn(VIS) journey?: Vis;
  @ApiPropertyOptional({ enum: VIS }) @IsOptional() @IsIn(VIS) birthday?: Vis;
  @ApiPropertyOptional({ enum: VIS }) @IsOptional() @IsIn(VIS) socials?: Vis;
  @ApiPropertyOptional({ enum: VIS, description: 'Phone number: PRIVATE unless the member opens it' }) @IsOptional() @IsIn(VIS) phone?: Vis;
}

const year = () => [IsOptional(), IsInt(), Min(1930), Max(THIS_YEAR)];
const list = (max: number) => [IsOptional(), IsArray(), ArrayMaxSize(max), IsString({ each: true }), MaxLength(40, { each: true })];
const apply = (decorators: PropertyDecorator[]): PropertyDecorator => (target, key) => decorators.forEach((d) => d(target, key));

/** Every field is optional; null clears it. */
export class UpdateProfileDetailsDto {
  @ApiPropertyOptional({ example: 'Civil engineer · Choir member · Lover of the Psalms' }) @IsOptional() @IsString() @MaxLength(120) headline?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(400) favouriteVerse?: string | null;
  @ApiPropertyOptional({ example: 'Psalm 23:1' }) @IsOptional() @IsString() @MaxLength(60) favouriteVerseRef?: string | null;
  @ApiPropertyOptional() @apply(year()) bornAgainYear?: number | null;
  @ApiPropertyOptional() @apply(year()) waterBaptismYear?: number | null;
  @ApiPropertyOptional() @apply(year()) holySpiritYear?: number | null;
  @ApiPropertyOptional() @apply(year()) membershipClassYear?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) occupation?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) employer?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) industry?: string | null;
  @ApiPropertyOptional({ type: [ProfileRoleDto], description: 'What you do, e.g. CEO @sparkpayhq, Lead Pastor @everlastinghills (up to 8)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ProfileRoleDto)
  roles?: ProfileRoleDto[];
  @ApiPropertyOptional({ type: [String] }) @apply(list(30)) skills?: string[];
  @ApiPropertyOptional({ type: [String] }) @apply(list(30)) gifts?: string[];
  @ApiPropertyOptional({ type: [String] }) @apply(list(30)) interests?: string[];
  @ApiPropertyOptional({ type: [String] }) @apply(list(15)) languages?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) prayerFocus?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() testimony?: string | null;
  @ApiPropertyOptional({ type: [String] }) @apply(list(6)) openTo?: string[];
  @ApiPropertyOptional({ type: ProfileVisibilityDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProfileVisibilityDto)
  visibility?: ProfileVisibilityDto;
}
