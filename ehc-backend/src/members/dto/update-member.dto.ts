import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Admin edit of a member's core fields (People console row editor).
 * All fields optional — only the supplied keys are applied.
 */
export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ example: 'jane.doe@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ example: '+234 801 234 5678' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], nullable: true })
  @IsOptional()
  @IsIn(['MALE', 'FEMALE', '', null])
  gender?: string | null;

  @ApiPropertyOptional({ example: '1995-04-19', description: 'ISO date or null' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ example: '12 Adeola Street, Ibadan' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;
}
