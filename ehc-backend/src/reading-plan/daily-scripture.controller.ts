import { Controller, Get, Header, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BiblePassageService } from './services/bible-passage.service';
import { DailyScriptureService } from './services/daily-scripture.service';

class DailyScriptureDto {
  @ApiProperty({ example: '2026-09-12' })
  date!: string;

  @ApiProperty({ example: 'Africa/Lagos' })
  timezone!: string;

  @ApiProperty({ example: 'Psalm 23:1' })
  reference!: string;

  @ApiProperty({
    description: 'The complete quotation from the stored Bible text',
  })
  text!: string;

  @ApiProperty({ example: 'WEB' })
  translationCode!: string;

  @ApiProperty({ example: 'World English Bible' })
  translationName!: string;
}

@ApiTags('reading-plans')
@Controller('bible')
export class DailyScriptureController {
  constructor(
    private readonly scripture: DailyScriptureService,
    private readonly passages: BiblePassageService,
  ) {}

  @Public()
  @Get('today')
  @Header(
    'Cache-Control',
    'public, max-age=60, s-maxage=300, stale-while-revalidate=300',
  )
  @ApiOperation({
    summary: 'Today’s scripture for the church, changing at midnight in Lagos',
  })
  @ApiOkResponse({ type: DailyScriptureDto })
  @ApiQuery({ name: 'translation', required: false, example: 'KJV' })
  today(@Query('translation') translation?: string) {
    return this.scripture.today(translation);
  }

  @Public()
  @Get('translations')
  @ApiOperation({
    summary: 'Bible translations available for the public daily scripture',
  })
  @Header('Cache-Control', 'public, max-age=86400')
  translations() {
    return this.passages.translations();
  }
}
