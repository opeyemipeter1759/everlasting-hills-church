import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InboxModule } from '../inbox/inbox.module';
import { UnitsController } from './units.controller';
import { UnitsMembersController } from './units-members.controller';
import { UnitPositionsController } from './unit-positions.controller';
import { UnitTasksController } from './unit-tasks.controller';
import { UnitExpensesController } from './unit-expenses.controller';
import { UnitMessagesController } from './unit-messages.controller';
import { UnitLeadSyncService } from './services/unit-lead-sync.service';
import { UnitsSelfService } from './services/units-self.service';
import { UnitsCrudService } from './services/units-crud.service';
import { UnitsMembershipService } from './services/units-membership.service';
import { UnitsRoleService } from './services/units-role.service';
import { UnitsDirectoryService } from './services/units-directory.service';
import { UnitLeadAppointmentService } from './services/unit-lead-appointment.service';
import { UnitPositionsService } from './services/unit-positions.service';
import { UnitTasksService } from './services/unit-tasks.service';
import { UnitExpensesService } from './services/unit-expenses.service';
import { UnitMessagesService } from './services/unit-messages.service';
import { UnitTaskCommentsService } from './services/unit-task-comments.service';

@Module({
  imports: [PrismaModule, AuthModule, InboxModule],
  controllers: [
    UnitsController,
    UnitsMembersController,
    UnitPositionsController,
    UnitTasksController,
    UnitExpensesController,
    UnitMessagesController,
  ],
  providers: [
    UnitLeadSyncService,
    UnitsSelfService,
    UnitsCrudService,
    UnitsMembershipService,
    UnitsRoleService,
    UnitsDirectoryService,
    UnitLeadAppointmentService,
    UnitPositionsService,
    UnitTasksService,
    UnitExpensesService,
    UnitMessagesService,
    UnitTaskCommentsService,
  ],
})
export class UnitsModule {}
