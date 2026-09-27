import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InboxModule } from '../inbox/inbox.module';
import { UploadsModule } from '../uploads/uploads.module';
import { EvangelismController } from './evangelism.controller';
import { EvangelismFormController } from './evangelism-form.controller';
import { EvangelismAccessService } from './services/evangelism-access.service';
import { EvangelismContactsService } from './services/evangelism-contacts.service';
import { EvangelismOutreachesService } from './services/evangelism-outreaches.service';
import { EvangelismPerformanceService } from './services/evangelism-performance.service';
import { EvangelismTasksService } from './services/evangelism-tasks.service';
import { EvangelismTestimoniesService } from './services/evangelism-testimonies.service';

/** Growth & Outreach → Evangelism Team: the outreach form, contacts, follow-up, tasks, outreaches, testimonies. */
@Module({
  imports: [PrismaModule, InboxModule, UploadsModule],
  controllers: [EvangelismFormController, EvangelismController],
  providers: [
    EvangelismAccessService,
    EvangelismContactsService,
    EvangelismOutreachesService,
    EvangelismPerformanceService,
    EvangelismTasksService,
    EvangelismTestimoniesService,
  ],
})
export class EvangelismModule {}
