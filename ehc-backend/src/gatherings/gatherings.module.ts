import { Module } from '@nestjs/common';
import { GatheringsController } from './gatherings.controller';
import { GatheringsService } from './gatherings.service';

/**
 * Recurring gatherings: the admin CRUD behind the rows that CalendarModule
 * exports as .ics and PushModule turns into start-time reminders.
 *
 * Neither of those imports this module — they read RecurringGathering through
 * Prisma directly, because what they need is the row, not the view model this
 * service builds. Exported anyway so a dashboard aggregate can reuse the next
 * occurrence and live-state calculation instead of repeating it.
 */
@Module({
  controllers: [GatheringsController],
  providers: [GatheringsService],
  exports: [GatheringsService],
})
export class GatheringsModule {}
