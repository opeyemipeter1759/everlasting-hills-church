import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

/**
 * Admin-authored announcements. ADMIN+ only (RolesGuard honours the hierarchy,
 * so PASTOR / SUPER_ADMIN are admitted too).
 */
@ApiTags('announcements')
@ApiBearerAuth('access-token')
@Controller('announcements')
@Roles(Role.ADMIN)
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an announcement — PUBLISHED fans out immediately, DRAFT saves quietly' })
  create(@Body() body: CreateAnnouncementDto, @CurrentUser() user: AuthUser) {
    return this.announcements.create(body, user.profileId);
  }

  @Get()
  @ApiOperation({ summary: 'List announcements' })
  list() {
    return this.announcements.list();
  }

  @Get('feed')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Recent published announcements for the member dashboard (max 5)' })
  feed() {
    return this.announcements.listFeed();
  }

  @Patch(':id')
  @ApiOperation({ summary: "Edit an announcement's title/body/email flag" })
  update(@Param('id') id: string, @Body() body: UpdateAnnouncementDto) {
    return this.announcements.update(id, body);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a saved draft — fans out to members now' })
  publish(@Param('id') id: string) {
    return this.announcements.publish(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an announcement' })
  remove(@Param('id') id: string) {
    return this.announcements.remove(id);
  }
}
