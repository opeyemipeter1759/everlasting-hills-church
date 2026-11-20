import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { CaseActionsService } from './case-actions.service';
import { CaseReadsService } from './case-reads.service';
import { PolicyService } from './policy';

/**
 * Pre-marital counselling cases. Signing in is the only route-level check: who
 * may see or do what is decided per case in CaseAccess, and anything a person
 * may not see answers 404.
 */
@ApiTags('premarital')
@Controller('premarital')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class PremaritalController {
  constructor(
    private readonly reads: CaseReadsService,
    private readonly actions: CaseActionsService,
    private readonly policy: PolicyService,
  ) {}

  @Get('access')
  @ApiOperation({
    summary: 'What the caller may do in the Marriage section (for the menu)',
  })
  access(@CurrentUser() actor: AuthUser) {
    return this.reads.whoAmI(actor);
  }

  @Get('overview')
  @ApiOperation({
    summary:
      'Counts only: total, new, awaiting review, in counselling, upcoming sessions, needs attention, completed',
  })
  overview(@CurrentUser() actor: AuthUser) {
    return this.reads.overview(actor);
  }

  @Get('applications')
  @ApiOperation({
    summary: 'Cases the caller may see, newest first, a page at a time',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'counsellor', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false })
  list(@CurrentUser() actor: AuthUser, @Query() query: Record<string, string>) {
    return this.reads.list(actor, query);
  }

  @Get('applications/:id')
  @ApiOperation({
    summary:
      'One case in full, with what the caller may do (recorded in the audit trail)',
  })
  detail(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.reads.detail(actor, id);
  }

  @Post('applications/:id/transitions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Move a case to its next status (pastors, Super Admin, marriage ministry)',
  })
  transition(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.actions.transition(actor, id, body);
  }

  @Post('applications/:id/request-info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Ask the couple for more information (pastors, Super Admin, marriage ministry)',
  })
  requestInfo(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.actions.requestInfo(actor, id, body);
  }

  @Patch('applications/:id/admin')
  @ApiOperation({
    summary:
      'Logistics note and member link (pastors, Super Admin, marriage ministry)',
  })
  updateAdmin(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.actions.updateAdmin(actor, id, body);
  }

  @Post('applications/:id/assignments')
  @ApiOperation({
    summary: 'Assign a counsellor, or make one the lead (pastors, Super Admin)',
  })
  assign(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.actions.assign(actor, id, body);
  }

  @Delete('assignments/:id')
  @ApiOperation({
    summary: 'End a counsellor assignment (pastors, Super Admin)',
  })
  unassign(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.actions.unassign(actor, id);
  }

  @Post('applications/:id/safeguarding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Raise or clear a safeguarding concern; raised cases are for pastors only (pastors)',
  })
  safeguarding(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.actions.safeguarding(actor, id, body);
  }

  @Post('applications/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a case (soft delete) (pastors, Super Admin)',
  })
  archive(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.actions.archive(actor, id);
  }

  @Post('applications/:id/wedding-approval')
  @ApiOperation({
    summary: 'Approve the wedding: a separate pastoral decision (pastors)',
  })
  approveWedding(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.actions.approveWedding(actor, id, body);
  }

  @Get('settings')
  @ApiOperation({
    summary: 'Counselling policy values and whether each is approved (staff)',
  })
  settings(@CurrentUser() actor: AuthUser) {
    return this.policy.forStaff(actor);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Save counselling policy values (pastors)' })
  saveSettings(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.policy.save(actor, body);
  }
}
