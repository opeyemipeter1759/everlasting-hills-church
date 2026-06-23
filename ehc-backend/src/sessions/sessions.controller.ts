import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { SessionsService } from './sessions.service';

@ApiTags('sessions')
@Controller('sessions')
@ApiBearerAuth('access-token')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('banner')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Live session banner for admin — open/closed status, countdown, check-in count (ADMIN+)' })
  @ApiOkResponse({
    schema: {
      examples: {
        open: {
          value: {
            hasActiveSession: true,
            session: {
              id: 'uuid',
              serviceName: 'Sunday Service',
              serviceKey: 'sunday',
              date: '2026-06-21',
              closesAt: '2026-06-21T12:00:00.000Z',
              checkedInCount: 34,
            },
            nextSession: null,
          },
        },
        closed: {
          value: {
            hasActiveSession: false,
            session: null,
            nextSession: {
              serviceName: 'Wednesday Service',
              serviceKey: 'wednesday',
              opensAt: '2026-06-24T16:30:00.000Z',
            },
          },
        },
      },
    },
  })
  getBanner() {
    return this.sessionsService.getBanner();
  }

  @Post('close')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Close today\'s session and mark all non-present members absent (ADMIN+)' })
  closeSession() {
    return this.sessionsService.closeSession();
  }
}
