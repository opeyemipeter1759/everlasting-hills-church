import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import {
  AdminCreatePrayerSignupDto,
  CreatePrayerSignupDto,
  MovePrayerSignupDto,
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
  signup(@Body() body: CreatePrayerSignupDto) {
    return this.prayerWatch.createSignup(body);
  }

  @Get('admin')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Full watch with names per slot (Admin Head+)' })
  getAdmin() {
    return this.prayerWatch.getAdminView();
  }

  @Get('admin/signups')
  @Roles(Role.ADMIN_HEAD)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Flat, searchable sign-up list (Admin Head+)' })
  listSignups() {
    return this.prayerWatch.listSignups();
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
