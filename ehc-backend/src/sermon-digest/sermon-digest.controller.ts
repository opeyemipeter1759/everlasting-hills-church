import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SermonDigestService, dailyCacheControl } from './sermon-digest.service';

/**
 * Public reads of the sermon digest. Both answer 200 with `ready: false`
 * before the first sermon has been summarised, so the website can show a
 * friendly "coming soon" rather than treat it as an error.
 */
@ApiTags('sermon-digest')
@Controller('sermon-digest')
export class SermonDigestController {
  constructor(private readonly digest: SermonDigestService) {}

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Summary of the latest sermon from the church YouTube channel' })
  async latest(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', dailyCacheControl());
    const latest = await this.digest.latest();
    return latest ? { ready: true as const, ...latest } : { ready: false as const };
  }

  @Public()
  @Get('word-of-the-day')
  @ApiOperation({ summary: 'Word of the Day from the latest sermon' })
  async wordOfTheDay(@Res({ passthrough: true }) res: Response) {
    // Cached only until Lagos midnight, when today's confession changes.
    res.setHeader('Cache-Control', dailyCacheControl());
    const latest = await this.digest.latest();
    if (!latest) return { ready: false as const };
    const { wordOfTheDay, sermonTitle, preacher, serviceDay, serviceDate, watchUrl, videoId, confessionDay } = latest;
    // wordOfTheDay.confession is today's: it changes daily until the next service.
    return { ready: true as const, ...wordOfTheDay, sermonTitle, preacher, serviceDay, serviceDate, watchUrl, videoId, confessionDay };
  }
}
