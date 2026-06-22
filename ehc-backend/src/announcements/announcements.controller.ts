import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

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
  @ApiOperation({ summary: 'Create an announcement (fans out to members)' })
  create(@Body() body: CreateAnnouncementDto, @CurrentUser() user: AuthUser) {
    return this.announcements.create(body, user.profileId);
  }

  @Get()
  @ApiOperation({ summary: 'List announcements' })
  list() {
    return this.announcements.list();
  }
}
