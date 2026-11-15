import { Controller, Delete, Get, Header, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { GiftExchangeService } from './gift-exchange.service';

/**
 * A member's gift exchange: one tap in, one tap out. No request bodies; the
 * member is always the signed-in person. Signed-out requests get 401 from the
 * global JwtAuthGuard.
 */
@ApiTags('gift-exchange')
@ApiBearerAuth('access-token')
@Roles(Role.MEMBER)
@Controller('gift-exchange')
export class GiftExchangeController {
  constructor(private readonly giftExchange: GiftExchangeService) {}

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Whether I am in, how many are interested, and (when I am) the countdown target with server time' })
  me(@CurrentUser() actor: AuthUser) {
    return this.giftExchange.me(actor);
  }

  @Post('register')
  @HttpCode(200)
  @ApiOperation({ summary: 'Show interest in the gift exchange (idempotent; 403 if my entry was rejected)' })
  register(@CurrentUser() actor: AuthUser) {
    return this.giftExchange.register(actor);
  }

  @Delete('register')
  @ApiOperation({ summary: 'Withdraw my interest (no-op if not registered; a rejected entry is left as it is)' })
  withdraw(@CurrentUser() actor: AuthUser) {
    return this.giftExchange.withdraw(actor);
  }
}
