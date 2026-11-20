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
import { ModulesService } from './modules.service';
import { SessionsService } from './sessions.service';

/** Sessions, progress and the curriculum. Access is decided per case in CaseAccess (404 otherwise). */
@ApiTags('premarital')
@Controller('premarital')
@Roles(Role.MEMBER)
@ApiBearerAuth('access-token')
export class PremaritalSessionsController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly modules: ModulesService,
  ) {}

  @Get('sessions')
  @ApiOperation({
    summary:
      'Sessions between two Lagos dates: all for staff, their own for a counsellor',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  list(@CurrentUser() actor: AuthUser, @Query() query: Record<string, string>) {
    return this.sessions.list(actor, query);
  }

  @Post('applications/:id/sessions')
  @ApiOperation({
    summary: 'Book a session (staff, or the case counsellor for themselves)',
  })
  create(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.sessions.create(actor, id, body);
  }

  @Post('sessions/:id/reschedule')
  @ApiOperation({ summary: 'Move a session to a new time' })
  reschedule(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.sessions.reschedule(actor, id, body);
  }

  @Patch('sessions/:id')
  @ApiOperation({
    summary: 'Change where a session is, its length or its module',
  })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.sessions.update(actor, id, body);
  }

  @Post('sessions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a session' })
  cancel(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.sessions.cancel(actor, id);
  }

  @Put('sessions/:id/attendance')
  @ApiOperation({ summary: 'Mark who attended a session' })
  attendance(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.sessions.attendance(actor, id, body);
  }

  @Put('applications/:id/progress/:moduleId')
  @ApiOperation({ summary: 'Mark a curriculum module done for a case' })
  done(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.sessions.setProgress(actor, id, moduleId, true);
  }

  @Delete('applications/:id/progress/:moduleId')
  @ApiOperation({ summary: 'Mark a curriculum module not done' })
  undone(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.sessions.setProgress(actor, id, moduleId, false);
  }

  @Get('modules')
  @ApiOperation({
    summary:
      'The curriculum: every module for staff, the active ones for a counsellor',
  })
  listModules(@CurrentUser() actor: AuthUser) {
    return this.modules.list(actor);
  }

  @Post('modules')
  @ApiOperation({ summary: 'Add a curriculum module (staff)' })
  createModule(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.modules.create(actor, body);
  }

  @Put('modules/order')
  @ApiOperation({ summary: 'Reorder the curriculum (staff)' })
  reorder(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.modules.reorder(actor, body);
  }

  @Patch('modules/:id')
  @ApiOperation({
    summary:
      'Edit a module or switch it on or off; editing an approved module sends it back for approval (staff)',
  })
  updateModule(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.modules.update(actor, id, body);
  }

  @Post('modules/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a curriculum module (pastors)' })
  approve(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.modules.approve(actor, id);
  }
}
