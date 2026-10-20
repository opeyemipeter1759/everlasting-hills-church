import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InboxModule } from '../inbox/inbox.module';
import { ClassesController } from './classes.controller';
import { ClassesAdminController } from './classes-admin.controller';
import { ClassesLearnerService } from './classes-learner.service';
import { ClassesAdminService } from './classes-admin.service';
import { ClassApplicationsService } from './class-applications.service';
import { ClassWatchService } from './class-watch.service';
import { VIDEO_SOURCE, YouTubeVideoSource } from './video-source';
import { MembershipService } from './membership.service';

/** The church's classes (Membership Class first) and membership status. */
@Module({
  imports: [PrismaModule, InboxModule],
  controllers: [ClassesController, ClassesAdminController],
  providers: [
    ClassesLearnerService,
    ClassesAdminService,
    ClassApplicationsService,
    ClassWatchService,
    MembershipService,
    { provide: VIDEO_SOURCE, useClass: YouTubeVideoSource },
  ],
  exports: [MembershipService, ClassesAdminService],
})
export class ClassesModule {}
