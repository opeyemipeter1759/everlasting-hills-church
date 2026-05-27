import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { UnitsService } from './units.service';

/**
 * User-scoped unit endpoints. Authenticated only; no @Roles because:
 *   - any member with a UnitMember row leads or follows; lookup is identity-based not role-based
 *   - admins fall through to null gracefully
 */
@ApiTags('units')
@Controller('units')
@ApiBearerAuth('access-token')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the unit the current user leads (or null if none)' })
  @ApiOkResponse({
    description: 'The unit led by the current user, or null',
    schema: {
      example: {
        id: 'unit-uuid',
        name: 'Hospitality',
        description: 'Front-door welcome team',
        totalMembers: 25,
        isLead: true,
      },
    },
  })
  async getMyUnit(@CurrentUser() user: AuthUser) {
    return this.unitsService.findUnitLedBy(user.userId);
  }
}
