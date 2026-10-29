import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import {
  AdminCreatePrayerSignupDto,
  CreatePrayerSignupDto,
  CreatePrayerWatchReflectionDto,
  DecideFamilyChangeDto,
  DecideSignupDto,
  MovePrayerSignupDto,
  RequestFamilyChangeDto,
  SetSlotLeaderDto,
  UpdatePrayerWatchDto,
} from './dto/prayer-watch.dto';
import { PrayerWatchService } from './prayer-watch.service';

/** Public sign-up + admin management for the overnight prayer watch. */
@ApiTags('prayer-watch')
@Controller('prayer-watch')
export class PrayerWatchController {
  constructor(private readonly prayerWatch: PrayerWatchService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('current')
  @ApiOperation({ summary: 'The current watch and slot availability — no names, public' })
  getCurrent() {
    return this.prayerWatch.getPublicView();
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up for a slot — public, no session required' })
  signup(@Body() body: CreatePrayerSignupDto, @CurrentUser() user?: AuthUser) {
    return this.prayerWatch.createSignup(body, user?.profileId ?? null);
  }

  // ── Self-service (authenticated member, own sign-up only) ──────────────────

  @Get('mine')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'My own sign-up for the current watch, if any' })
  getMine(@CurrentUser() user: AuthUser) {
    return this.prayerWatch.getMySignup(user.profileId!);
  }

  @Get('mine/history')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Past watches I have kept, with any reflection I left' })
  getMyHistory(@CurrentUser() user: AuthUser) {
    return this.prayerWatch.getMyHistory(user.profileId!);
  }

  @Post('mine/:id/family-change-request')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request to move to a different Prayer Watchmen Family — reviewed by an admin' })
  requestFamilyChange(@Param('id') id: string, @Body() body: RequestFamilyChangeDto, @CurrentUser() user: AuthUser) {
    return this.prayerWatch.requestFamilyChange(id, user.profileId!, body);
  }

  @Get('mine/:id.ics')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Download my chosen hour as .ics' })
  async myIcs(@Param('id') id: string, @CurrentUser() user: AuthUser, @Res() res: Response) {
    const { filename, body } = await this.prayerWatch.buildSignupIcs(id, user.profileId!);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(body);
  }

  @Post('mine/:id/reflections')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Log what I sensed God say during my watch hour, once it has passed — a new dated entry each time' })
  addReflection(@Param('id') id: string, @Body() body: CreatePrayerWatchReflectionDto, @CurrentUser() user: AuthUser) {
    return this.prayerWatch.addReflection(id, user.profileId!, body);
  }

  @Get('slots/:slotId/companions')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'First names of others on the same watch hour' })
  getCompanions(@Param('slotId') slotId: string, @CurrentUser() user: AuthUser) {
    return this.prayerWatch.getSlotCompanions(slotId, user.profileId);
  }

  @Get('admin')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Full watch with names per slot (Admin Head+)' })
  getAdmin() {
    return this.prayerWatch.getAdminView();
  }

  @Get('admin/reflections')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'What members sensed God say during their watch hour (Admin Head+)' })
  getReflections() {
    return this.prayerWatch.listReflections();
  }

  @Delete('admin/reflections/:id')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove a reflection entry (Admin Head+)' })
  removeReflection(@Param('id') id: string) {
    return this.prayerWatch.removeReflection(id);
  }

  @Get('admin/family-change-requests')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Requests to change Prayer Watchmen Family (Admin Head+)' })
  listFamilyChangeRequests(@Query('status') status?: string) {
    return this.prayerWatch.listFamilyChangeRequests(status === 'DECIDED' ? 'DECIDED' : 'PENDING');
  }

  @Post('admin/family-change-requests/:id/approve')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve a Prayer Watchmen Family change request — moves the sign-up (Admin Head+)' })
  approveFamilyChange(@Param('id') id: string, @Body() body: DecideFamilyChangeDto, @CurrentUser() user: AuthUser) {
    return this.prayerWatch.decideFamilyChange(user.profileId!, id, true, body);
  }

  @Post('admin/family-change-requests/:id/decline')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Decline a Prayer Watchmen Family change request (Admin Head+)' })
  declineFamilyChange(@Param('id') id: string, @Body() body: DecideFamilyChangeDto, @CurrentUser() user: AuthUser) {
    return this.prayerWatch.decideFamilyChange(user.profileId!, id, false, body);
  }

  @Get('admin/signups')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Flat, searchable sign-up list (Admin Head+)' })
  listSignups() {
    return this.prayerWatch.listSignups();
  }

  @Get('admin/signups/pending')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Sign-ups waiting for approval (Admin Head+)' })
  listPendingSignups() {
    return this.prayerWatch.listPendingSignups();
  }

  @Post('admin/signups/:id/approve')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve a sign-up — confirms it and reveals the WhatsApp/Telegram links (Admin Head+)' })
  approveSignup(@Param('id') id: string, @Body() body: DecideSignupDto, @CurrentUser() user: AuthUser) {
    return this.prayerWatch.decideSignup(user.profileId!, id, true, body);
  }

  @Post('admin/signups/:id/decline')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Decline a sign-up, with a note the person sees (Admin Head+)' })
  declineSignup(@Param('id') id: string, @Body() body: DecideSignupDto, @CurrentUser() user: AuthUser) {
    return this.prayerWatch.decideSignup(user.profileId!, id, false, body);
  }

  @Post('admin/signups')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Manually add a sign-up (Admin Head+)' })
  addSignup(@Body() body: AdminCreatePrayerSignupDto) {
    return this.prayerWatch.createSignup(body);
  }

  @Delete('admin/signups/:id')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove a sign-up — soft delete (Admin Head+)' })
  removeSignup(@Param('id') id: string) {
    return this.prayerWatch.removeSignup(id);
  }

  @Patch('admin/signups/:id/move')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Move a sign-up to another slot (Admin Head+)' })
  moveSignup(@Param('id') id: string, @Body() body: MovePrayerSignupDto) {
    return this.prayerWatch.moveSignup(id, body);
  }

  @Patch('admin')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Edit watch title/date/slot capacities (Admin Head+)' })
  updateWatch(@Body() body: UpdatePrayerWatchDto) {
    return this.prayerWatch.updateWatch(body);
  }

  @Patch('admin/slots/:slotId/leader')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Set (or clear) a slot's leader, chosen from that slot's own sign-ups (Admin Head+)" })
  setSlotLeader(@Param('slotId') slotId: string, @Body() body: SetSlotLeaderDto) {
    return this.prayerWatch.setSlotLeader(slotId, body);
  }
}
