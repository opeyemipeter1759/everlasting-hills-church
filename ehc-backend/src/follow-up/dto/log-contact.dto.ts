import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FollowUpContactMethod, FollowUpContactOutcome, FollowUpLogKind } from '@prisma/client';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** A CONTACT log requires method + outcome (a real attempt); a QUICK_UPDATE is
 * just a note — both land on the same timeline. */
export class LogContactDto {
  @ApiPropertyOptional({ enum: [FollowUpLogKind.CONTACT, FollowUpLogKind.QUICK_UPDATE], default: FollowUpLogKind.CONTACT })
  @IsOptional()
  @IsIn([FollowUpLogKind.CONTACT, FollowUpLogKind.QUICK_UPDATE])
  kind?: typeof FollowUpLogKind.CONTACT | typeof FollowUpLogKind.QUICK_UPDATE;

  @ApiPropertyOptional({ enum: FollowUpContactMethod, example: FollowUpContactMethod.CALL, description: 'Required when kind = CONTACT' })
  @IsOptional()
  @IsEnum(FollowUpContactMethod)
  method?: FollowUpContactMethod;

  @ApiPropertyOptional({ enum: FollowUpContactOutcome, example: FollowUpContactOutcome.REACHED, description: 'Required when kind = CONTACT' })
  @IsOptional()
  @IsEnum(FollowUpContactOutcome)
  outcome?: FollowUpContactOutcome;

  @ApiProperty({ example: 'Spoke with her, she plans to visit again this Sunday.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note!: string;

  @ApiPropertyOptional({ description: "Tags this as the Pastor's own call, distinct from a worker's routine check-in" })
  @IsOptional()
  @IsBoolean()
  isPastoralContact?: boolean;

  @ApiPropertyOptional({ description: 'Visible only to the author and this entry\'s unit leader' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
