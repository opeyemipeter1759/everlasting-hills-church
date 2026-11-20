import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { ModulesService } from './modules.service';
import { PolicyService } from './policy';
import { PublicApplicationsService } from './public-applications.service';

/** The public side of pre-marital counselling: the page's content and the application. */
@ApiTags('premarital-public')
@Controller('public/premarital')
export class PublicPremaritalController {
  constructor(
    private readonly applications: PublicApplicationsService,
    private readonly modules: ModulesService,
    private readonly policy: PolicyService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Apply for pre-marital counselling; a repeat of the same application gets the same answer; answers with a reference only',
  })
  submit(@Body() body: unknown) {
    return this.applications.submit(body);
  }

  @Public()
  @Get('page')
  @ApiOperation({
    summary:
      "The public page's approved policy text, privacy notice and active curriculum (no personal data)",
  })
  async page() {
    const [policy, modules] = await Promise.all([
      this.policy.publicView(),
      this.modules.listPublic(),
    ]);
    return { policy, modules };
  }
}
