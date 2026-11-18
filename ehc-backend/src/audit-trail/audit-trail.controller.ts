import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { parseSchema } from '../common/zod-parse.util';
import { auditTrailQuerySchema } from './audit-trail.schema';
import { AuditTrailService } from './audit-trail.service';

@ApiTags('audit-trail')
@Controller('audit-trail')
@Roles(Role.SUPER_ADMIN)
@ApiBearerAuth('access-token')
export class AuditTrailController {
  constructor(private readonly trail: AuditTrailService) {}

  @Get()
  @ApiOperation({ summary: 'Everything people did on the dashboard, newest first, with who, when and the details (SUPER_ADMIN)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'area', required: false })
  @ApiQuery({ name: 'actor', required: false, description: "The person's sign-in id, from the filters list" })
  @ApiQuery({ name: 'from', required: false, description: 'A Lagos date, YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'A Lagos date, YYYY-MM-DD, included' })
  @ApiQuery({ name: 'cursor', required: false, description: 'nextCursor from the page before' })
  @ApiQuery({ name: 'take', required: false })
  list(
    @Query('search') search?: string,
    @Query('area') area?: string,
    @Query('actor') actor?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.trail.list(parseSchema(auditTrailQuerySchema, { search, area, actor, from, to, cursor, take }));
  }

  @Get('filters')
  @ApiOperation({ summary: 'The sections and the people that appear in the audit trail, for its filters (SUPER_ADMIN)' })
  filters() {
    return this.trail.filters();
  }
}
