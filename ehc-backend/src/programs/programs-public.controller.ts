import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiExtension, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { ProgramsPublicService } from './programs-public.service';

/** The public Programs pages. No sign-in; published programs of this church only. */
@ApiTags('programs-public')
@Controller('public/programs')
export class ProgramsPublicController {
  constructor(private readonly programs: ProgramsPublicService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Published programs, with what is on now and what is next' })
  list(@Res({ passthrough: true }) res: Response) {
    // Short: "live now" changes by the hour. The site revalidates on every admin write.
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return this.programs.list();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'One published program: schedule, watches, editions and the full scripture text' })
  detail(@Param('slug') slug: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return this.programs.detail(slug);
  }

  @Public()
  @Get(':slug/calendar.ics')
  @ApiOperation({ summary: 'Add a program to a calendar (confirmed dates only)' })
  @ApiExtension('x-response-envelope', false)
  @ApiProduces('text/calendar')
  async calendar(@Param('slug') slug: string, @Res() res: Response) {
    const { filename, body } = await this.programs.calendar(slug);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(body);
  }
}
