import { ApiProperty } from '@nestjs/swagger';
import { MemberStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

/** The People console intentionally exposes one live and one non-active state. */
export class UpdateMemberStatusDto {
  @ApiProperty({ enum: [MemberStatus.ACTIVE, MemberStatus.INACTIVE] })
  @IsIn([MemberStatus.ACTIVE, MemberStatus.INACTIVE])
  status!: Extract<MemberStatus, 'ACTIVE' | 'INACTIVE'>;
}
