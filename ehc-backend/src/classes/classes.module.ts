import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InboxModule } from '../inbox/inbox.module';
import { ClassesController } from './classes.controller';
import { ClassesAdminController } from './classes-admin.controller';
import { ClassesLearnerService } from './classes-learner.service';
import { ClassesAdminService } from './classes-admin.service';
import { MembershipService } from './membership.service';

/** The church's classes (Membership Class first) and membership status. */
@Module({
  imports: [PrismaModule, InboxModule],
  controllers: [ClassesController, ClassesAdminController],
  providers: [ClassesLearnerService, ClassesAdminService, MembershipService],
  exports: [MembershipService, ClassesAdminService],
})
export class ClassesModule {}
