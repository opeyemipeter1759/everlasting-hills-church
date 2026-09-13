import { Controller, Get, Header, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReadingPlanCatalogueService } from './services/reading-plan-catalogue.service';
import { BiblePassageService } from './services/bible-passage.service';
import { ListPlansQueryDto } from './dto/reading-plan.dto';

/**
 * The immutable half of the reading plan API.
 *
 * Split from the private half strictly by cacheability. A published plan cannot
 * change and scripture never changes, so everything here carries a long cache
 * header. Nothing member specific may be added to these responses: one private
 * field would poison a shared cache for every other member.
 */
@ApiTags('reading-plans')
@Controller()
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class ReadingPlanController {
  constructor(
    private readonly catalogue: ReadingPlanCatalogueService,
    private readonly passages: BiblePassageService,
  ) {}

  @Get('reading-plans')
  @ApiOperation({ summary: 'Published plans this church offers, optionally filtered by track' })
  // Shorter than the rest: the catalogue changes when a church forks a plan.
  @Header('Cache-Control', 'private, max-age=300')
  list(@Query() query: ListPlansQueryDto) {
    return this.catalogue.list(query.track, query.intensity);
  }

  @Get('reading-plans/:planId')
  @ApiOperation({ summary: 'Plan detail' })
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  detail(@Param('planId') planId: string) {
    return this.catalogue.detail(planId);
  }

  @Get('reading-plans/:planId/days')
  @ApiOperation({ summary: 'Paginated day list for a plan' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  days(
    @Param('planId') planId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogue.days(planId, Number(page) || 1, Number(limit) || 30);
  }

  @Get('reading-plans/:planId/days/:dayIndex')
  @ApiOperation({ summary: 'One day with its portions. References only, no scripture text' })
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  day(@Param('planId') planId: string, @Param('dayIndex', ParseIntPipe) dayIndex: number) {
    return this.catalogue.day(planId, dayIndex);
  }

  @Get('bible/translations')
  @ApiOperation({ summary: 'Translations a member can read in' })
  @Header('Cache-Control', 'public, max-age=86400')
  translations() {
    return this.passages.translations();
  }

  @Get('bible/passage')
  @ApiOperation({
    summary:
      'Scripture text for a verse range. The highest leverage cache in the feature: the text never changes.',
  })
  @ApiQuery({ name: 'translation', required: false, example: 'WEB' })
  @ApiQuery({ name: 'start', required: true, example: 43003016 })
  @ApiQuery({ name: 'end', required: true, example: 43003016 })
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  passage(
    @Query('start', ParseIntPipe) start: number,
    @Query('end', ParseIntPipe) end: number,
    @Query('translation') translation?: string,
  ) {
    return this.passages.passage({
      translationCode: translation,
      startVerseId: start,
      endVerseId: end,
    });
  }
}
