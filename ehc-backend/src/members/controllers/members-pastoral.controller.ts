import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MemberRiskService } from '../services/member-risk.service';

/**
 * Pastoral oversight: birthdays, absenteeism/at-risk reporting, pastor notes, follow-up tasks.
 *
 * Registered before MembersController (which owns the GET /:id catch-all) so that
 * GET /members/at-risk resolves here.
 */
@ApiTags('members')
@Controller('members')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class MembersPastoralController {
  constructor(
    private readonly risk: MemberRiskService,
  ) {}

  @Get('at-risk')
  @ApiOperation({
    summary: 'Members at risk, judged on Sundays since each joined: missed the last 3+, never checked in, or under half of the last 8 (ADMIN+)',
  })
  @ApiOkResponse({
    schema: {
      example: {
        absentConsecutiveWeeks: [{ userId: 'uuid', userName: 'Emeka Nwosu', consecutiveAbsences: 3, presentCount: 4, totalCount: 8, lastSeen: '2026-10-18' }],
        neverAttended: [{ userId: 'uuid', userName: 'Tolu Bello', joinedAt: '2026-06-01', sundaysSinceJoining: 12, lastSeen: null }],
        belowFiftyPercent: [{ userId: 'uuid', userName: 'Sade Kalu', presentCount: 3, totalCount: 8, rate: 0.38, lastSeen: '2026-11-08' }],
        window: { sundays: 8, from: '2026-09-20', to: '2026-11-08' },
      },
    },
  })
  getAtRisk() {
    return this.risk.getMembersAtRisk();
  }
}
