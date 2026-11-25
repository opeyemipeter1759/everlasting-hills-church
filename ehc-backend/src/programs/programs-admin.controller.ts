import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { ProgramsAdminService } from './programs-admin.service';

/**
 * The Programs manager. Admin, Admin Head, Pastor and Super Admin (the role
 * hierarchy); everyone else, Unit Leads included, gets 403. Roles come from
 * assignment rows (effectiveRoles), never from the token.
 */
@ApiTags('programs-admin')
@ApiBearerAuth('access-token')
@Roles(Role.ADMIN)
@Controller('programs')
export class ProgramsAdminController {
  constructor(private readonly programs: ProgramsAdminService) {}

  @Get()
  @ApiOperation({ summary: 'Every program of this church, in order, with what needs attention' })
  list() {
    return this.programs.list();
  }

  @Get('bible-books')
  @ApiOperation({ summary: 'Books of the Bible, for the scripture picker' })
  books() {
    return this.programs.books();
  }

  @Get('scripture-check')
  @ApiOperation({ summary: 'Check a scripture reference against the Bible and return its text' })
  checkReference(@Query('reference') reference: string) {
    return this.programs.checkReference(reference);
  }

  @Post('schedule-preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'A schedule being edited, in words, with its next three dates' })
  schedulePreview(@Body() body: unknown) {
    return this.programs.schedulePreview(body);
  }

  @Patch('order')
  @ApiOperation({ summary: 'Save the order: program ids first to last' })
  reorder(@Body() body: unknown) {
    return this.programs.reorder(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One program with its scriptures, sessions, editions and next dates' })
  get(@Param('id') id: string) {
    return this.programs.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a program (saved as a draft)' })
  create(@CurrentUser() actor: AuthUser, @Body() body: unknown) {
    return this.programs.create(actor, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Change some fields; fields left out keep their values' })
  update(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.programs.update(actor, id, body);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.programs.publish(actor, id);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.programs.unpublish(actor, id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.programs.archive(actor, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a program that is not published' })
  remove(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.programs.remove(actor, id);
  }

  @Put(':id/scriptures')
  @ApiOperation({ summary: 'Replace the scriptures (each checked against the Bible)' })
  scriptures(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.programs.replaceScriptures(actor, id, body);
  }

  @Put(':id/sessions')
  @ApiOperation({ summary: 'Replace the sessions (the watches)' })
  sessions(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.programs.replaceSessions(actor, id, body);
  }

  @Put(':id/editions')
  @ApiOperation({ summary: 'Replace the editions of an annual program' })
  editions(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.programs.replaceEditions(actor, id, body);
  }
}
