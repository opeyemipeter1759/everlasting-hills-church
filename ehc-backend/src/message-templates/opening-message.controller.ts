import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { parseSchema } from '../common/zod-parse.util';
import { bulkEmailSchema, whatsappSentSchema } from './message-template.schema';
import { OpeningMessageService } from './opening-message.service';
import { OpeningQueueService } from './opening-queue.service';

const SENDERS = [Role.FIRST_TIMER_CONTACT, Role.ADMIN];

/**
 * Sending the opening message to first-timers. Reading a person's sends is
 * open to the follow-up team (checked in the service); sending is for the
 * first-timer contact and church admins.
 */
@ApiTags('opening-message')
@Controller('opening-message')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class OpeningMessageController {
  constructor(
    private readonly opening: OpeningMessageService,
    private readonly queue: OpeningQueueService,
  ) {}

  @Get('queue')
  @Roles(...SENDERS)
  @ApiOperation({ summary: 'First-timers nobody has contacted yet, oldest first, each with a ready WhatsApp link' })
  list(@CurrentUser() actor: AuthUser) {
    return this.queue.queue(actor);
  }

  @Get('first-timers/:visitorId')
  @ApiOperation({ summary: 'What a send to this first-timer would say, and every send so far' })
  context(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    return this.opening.context(actor, visitorId);
  }

  @Post('first-timers/:visitorId/whatsapp')
  @Roles(...SENDERS)
  @ApiOperation({ summary: 'Log a WhatsApp send, when the sender taps the button' })
  whatsapp(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string, @Body() body: unknown) {
    return this.opening.logWhatsApp(actor, visitorId, parseSchema(whatsappSentSchema, body).templateVersion);
  }

  @Post('first-timers/:visitorId/email')
  @Roles(...SENDERS)
  @ApiOperation({ summary: 'Email the opening message to one first-timer, within the daily email budget' })
  email(@CurrentUser() actor: AuthUser, @Param('visitorId') visitorId: string) {
    return this.opening.sendEmail(actor, visitorId);
  }

  @Post('email')
  @Roles(...SENDERS)
  @ApiOperation({ summary: 'Email up to 25 first-timers; stops at the daily reserve and reports who did not get it' })
  bulk(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.opening.bulkEmail(actor, parseSchema(bulkEmailSchema, body).visitorIds);
  }
}
