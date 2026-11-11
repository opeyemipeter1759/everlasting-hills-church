import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PushModule } from '../push/push.module';
import { ServiceReadinessController } from './service-readiness.controller';
import { ServiceReadinessPlansController } from './service-readiness-plans.controller';
import { ServiceReadinessSetupService } from './service-readiness-setup.service';
import { ServiceCalendarService } from './service-calendar.service';
import { ServiceReadinessPlansService } from './service-readiness-plans.service';
import { ServiceReadinessViewsService } from './service-readiness-views.service';
import { ServiceReadinessRemindersService } from './service-readiness-reminders.service';
import { ServiceInspectionsService } from './service-inspections.service';
import { ServiceReadinessNotifyService } from './service-readiness-notify.service';
import { ServiceReadinessUpdatesService } from './service-readiness-updates.service';

/** Service Readiness (Administration Manual): setup, departments' plans, the board and reminders. */
@Module({
  imports: [PrismaModule, PushModule],
  controllers: [ServiceReadinessController, ServiceReadinessPlansController],
  providers: [
    ServiceReadinessSetupService,
    ServiceCalendarService,
    ServiceReadinessPlansService,
    ServiceReadinessViewsService,
    ServiceReadinessRemindersService,
    ServiceInspectionsService,
    ServiceReadinessNotifyService,
    ServiceReadinessUpdatesService,
  ],
  exports: [ServiceCalendarService, ServiceReadinessRemindersService],
})
export class ServiceReadinessModule {}
