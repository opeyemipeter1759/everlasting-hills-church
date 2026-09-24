import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SermonDigestService } from './sermon-digest.service';

/** Cached at the edge: a new sermon arrives at most every few hours. */
const CACHE = 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600';

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
  @Header('Cache-Control', CACHE)
  @ApiOperation({ summary: 'Summary of the latest sermon from the church YouTube channel' })
  async latest() {
    const latest = await this.digest.latest();
    return latest ? { ready: true as const, ...latest } : { ready: false as const };
  }

  @Public()
  @Get('word-of-the-day')
  @Header('Cache-Control', CACHE)
  @ApiOperation({ summary: 'Word of the Day from the latest sermon' })
  async wordOfTheDay() {
    const latest = await this.digest.latest();
    if (!latest) return { ready: false as const };
    const { wordOfTheDay, sermonTitle, preacher, serviceDay, serviceDate, watchUrl, videoId } = latest;
    return { ready: true as const, ...wordOfTheDay, sermonTitle, preacher, serviceDay, serviceDate, watchUrl, videoId };
  }
}
