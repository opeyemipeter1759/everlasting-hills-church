import { Controller, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { FollowUpMemberStatusService } from './services/follow-up-member-status.service';

@ApiTags('follow-up')
@Controller('follow-up')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class FollowUpMemberStatusController {
  constructor(private readonly memberStatus: FollowUpMemberStatusService) {}

  @Patch(':id/opt-out')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: "Opt this entry's member out — blocks their login until restored (UNIT_LEAD+ of that unit)" })
  async optOut(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.memberStatus.optOutMember(actor, id);
  }

  @Patch(':id/restore')
  @Roles(Role.UNIT_LEAD)
  @ApiOperation({ summary: "Restore an opted-out member's login access (UNIT_LEAD+ of that unit)" })
  async restore(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.memberStatus.restoreMember(actor, id);
  }
}
