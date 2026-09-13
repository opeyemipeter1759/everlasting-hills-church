import { Controller, Get, Header } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
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
@ApiBearerAuth('access-token')
@Roles(Role.MEMBER)
@Controller('bible')
export class DailyScriptureController {
  constructor(private readonly scripture: DailyScriptureService) {}

  @Get('today')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    summary: 'Today’s scripture for the church, changing at midnight in Lagos',
  })
  @ApiOkResponse({ type: DailyScriptureDto })
  today() {
    return this.scripture.today();
  }
}
