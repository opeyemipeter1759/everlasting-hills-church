import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InboxModule } from '../inbox/inbox.module';
import { DepartmentsMineController } from './departments-mine.controller';
import { DepartmentsController } from './departments.controller';
import { DepartmentsSharedService } from './services/departments-shared.service';
import { DepartmentsScopeService } from './services/departments-scope.service';
import { DepartmentHodService } from './services/department-hod.service';
import { DepartmentsReadService } from './services/departments-read.service';
import { DepartmentsCrudService } from './services/departments-crud.service';
import { DepartmentHeadService } from './services/department-head.service';
import { DepartmentsUnitsService } from './services/departments-units.service';
import { DepartmentsMineService } from './services/departments-mine.service';
import { DepartmentsEngagementService } from './services/departments-engagement.service';

@Module({
  imports: [PrismaModule, AuthModule, InboxModule],
  // DepartmentsMineController owns GET/POST 'mine*' routes; DepartmentsController owns
  // the GET/POST/PATCH/DELETE ':id' routes. Mine must be registered first so 'mine' is
  // never captured as a department id.
  controllers: [DepartmentsMineController, DepartmentsController],
  providers: [
    DepartmentsSharedService,
    DepartmentsScopeService,
    DepartmentHodService,
    DepartmentsReadService,
    DepartmentsCrudService,
    DepartmentHeadService,
    DepartmentsUnitsService,
    DepartmentsMineService,
    DepartmentsEngagementService,
  ],
})
export class DepartmentsModule {}
