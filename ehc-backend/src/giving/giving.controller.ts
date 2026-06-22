import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { GivingService } from './giving.service';
import { InitGivingDto } from './dto/init-giving.dto';

@ApiTags('giving')
@Controller('giving')
export class GivingController {
  constructor(private readonly giving: GivingService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('initialize')
  @ApiOperation({ summary: 'Start an online gift (returns Paystack checkout URL)' })
  async initialize(@Body() body: InitGivingDto) {
    return this.giving.initialize(body);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify a transaction by reference' })
  async verify(@Param('reference') reference: string) {
    return this.giving.verify(reference);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook (HMAC-verified)' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    // rawBody is populated because the app is created with { rawBody: true }.
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    return this.giving.handleWebhook(raw, signature);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My giving history' })
  async myGiving(@CurrentUser() user: AuthUser) {
    return this.giving.listForEmail(user.email);
  }
}
