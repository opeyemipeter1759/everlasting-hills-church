import { Controller, Get, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminReadingService } from './services/admin-reading.service';

/**
 * Bible reading across the church, read-only.
 *
 * ADMIN admits ADMIN, ADMIN_HEAD, PASTOR and SUPER_ADMIN, the same set that
 * reads the service-team roster. A member's own progress stays on the
 * me/reading-plan routes; nothing here can change it.
 */
@ApiTags('reading-plans')
@Controller('reading-monitor')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AdminReadingController {
  constructor(private readonly service: AdminReadingService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'How every active member is reading: plans, progress, last reading and recent activity (ADMIN+)',
  })
  overview() {
    return this.service.overview();
  }
}
