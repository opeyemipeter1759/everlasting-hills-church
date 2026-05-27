import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { VisitorsService } from './visitors.service';

/**
 * Admin read-only visitor endpoints. ADMIN+ via class-level @Roles.
 * Visitor *creation* is the public POST /forms/register flow — kept separate so spam-tight
 * throttling on the public form doesn't accidentally apply to admin listings.
 */
@ApiTags('visitors')
@Controller('visitors')
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Get()
  @ApiOperation({ summary: 'List visitors' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiOkResponse({ description: 'Visitor list ordered by submittedAt desc' })
  async list(@Query('limit') limit?: string, @Query('search') search?: string) {
    return this.visitorsService.list({
      limit: limit ? Number(limit) : undefined,
      search,
    });
  }

  @Get('count')
  @ApiOperation({ summary: 'Total visitor count' })
  @ApiOkResponse({ description: 'Total visitors for this tenant' })
  async count() {
    return { count: await this.visitorsService.count() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visitor by id' })
  async getById(@Param('id') id: string) {
    return this.visitorsService.getById(id);
  }
}
