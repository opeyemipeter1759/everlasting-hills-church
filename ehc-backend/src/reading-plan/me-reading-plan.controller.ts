import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { MeReadingPlanService } from './services/me-reading-plan.service';
import { SubscribeDto, UpdateSubscriptionDto } from './dto/reading-plan.dto';

/**
 * A member's own plan. Private, never cached, never shared.
 *
 * Mutations are addressed by the day they affect rather than by an implied
 * cursor, which is what makes them idempotent and what keeps the offline queue
 * in Section 10 from needing any reconciliation logic at all.
 */
@ApiTags('reading-plans')
@Controller('me/reading-plan')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class MeReadingPlanController {
  constructor(private readonly service: MeReadingPlanService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      "Today's reading for the current member, or null when they have not chosen a plan. References only, no scripture text.",
  })
  today(@CurrentUser() actor: AuthUser) {
    return this.service.today(actor);
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Start a plan. Any active plan is paused, never deleted.' })
  subscribe(@CurrentUser() actor: AuthUser, @Body() body: SubscribeDto) {
    return this.service.subscribe(actor, body);
  }

  @Patch('subscriptions/:id')
  @ApiOperation({ summary: 'Pause, resume, change translation, timezone or reminder hour' })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateSubscriptionDto,
  ) {
    return this.service.update(actor, id, body);
  }

  @Get('subscriptions/:id/days/completed')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Day indexes already read, for ticking off a day list' })
  completedDays(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.service.completedDays(actor, id);
  }

  @Put('subscriptions/:id/days/:dayIndex/complete')
  @ApiOperation({
    summary:
      'Mark a day read. Idempotent by construction: five identical requests leave completedDays at one.',
  })
  complete(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
  ) {
    return this.service.completeDay(actor, id, dayIndex);
  }

  @Delete('subscriptions/:id/days/:dayIndex/complete')
  @ApiOperation({ summary: 'Undo a completion, for a mis-tap' })
  uncomplete(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
  ) {
    return this.service.uncompleteDay(actor, id, dayIndex);
  }
}
