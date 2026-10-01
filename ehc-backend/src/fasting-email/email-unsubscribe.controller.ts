import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { EmailUnsubscribeService } from './email-unsubscribe.service';

export class UnsubscribeDto {
  @ApiProperty() @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty() @IsString() @MaxLength(64) token!: string;
}

@ApiTags('email')
@Controller('email')
export class EmailUnsubscribeController {
  constructor(private readonly unsubscribes: EmailUnsubscribeService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop church bulk emails for an address (signed link from the email)' })
  async unsubscribe(@Body() body: UnsubscribeDto) {
    return this.unsubscribes.unsubscribe(body.email, body.token);
  }
}
