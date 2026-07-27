import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SubscribeEmailDto } from '../dto/subscribe-email.dto';
import { SermonSubscribersService } from '../services/sermon-subscribers.service';

@ApiTags('sermons')
@Controller('sermons')
export class SermonsSubscribersController {
  constructor(private readonly subscribers: SermonSubscribersService) {}

  @Public()
  @Post('subscribers')
  @ApiOperation({ summary: 'Subscribe email (public)' })
  @ApiBody({ type: SubscribeEmailDto })
  subscribe(@Body() body: SubscribeEmailDto) {
    return this.subscribers.subscribeEmail(body.email);
  }

  @Roles(Role.PASTOR)
  @Get('subscribers')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List subscribers' })
  getSubscribers() {
    return this.subscribers.getSubscribers();
  }

  // Scheduled publishing — internal/cron. PASTOR+ for now; later: lock to a service token.
  @Roles(Role.PASTOR)
  @Post('publish-scheduled')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Publish scheduled sermons (cron)' })
  publishScheduledSermons() {
    return this.subscribers.publishScheduledSermons();
  }
}
