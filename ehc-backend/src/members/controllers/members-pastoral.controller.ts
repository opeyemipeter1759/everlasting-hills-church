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
  @ApiOperation({ summary: 'Members at risk — consecutive absences, never attended, below 50% rate (ADMIN+)' })
  @ApiOkResponse({
    schema: {
      example: {
        absentConsecutiveWeeks: [{ userId: 'uuid', userName: 'Emeka Nwosu', consecutiveAbsences: 3, lastSeen: null }],
        neverAttended: [{ userId: 'uuid', userName: 'Tolu Bello', joinedAt: '2026-06-01' }],
        belowFiftyPercent: [{ userId: 'uuid', userName: 'Sade Kalu', presentCount: 3, totalCount: 10, rate: 0.3 }],
      },
    },
  })
  getAtRisk() {
    return this.risk.getMembersAtRisk();
  }
}
