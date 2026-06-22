import { Module } from '@nestjs/common';
import { InboxModule } from '../inbox/inbox.module';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

/**
 * Announcement broadcast. Imports InboxModule for the notification fan-out;
 * MailDispatcher and PrismaService come from their global modules.
 */
@Module({
  imports: [InboxModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
