import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UnitsController } from './units.controller';
import { UnitsMembersController } from './units-members.controller';
import { UnitLeadSyncService } from './services/unit-lead-sync.service';
import { UnitsSelfService } from './services/units-self.service';
import { UnitsCrudService } from './services/units-crud.service';
import { UnitsMembershipService } from './services/units-membership.service';
import { UnitsRoleService } from './services/units-role.service';
import { UnitsDirectoryService } from './services/units-directory.service';
import { UnitLeadAppointmentService } from './services/unit-lead-appointment.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UnitsController, UnitsMembersController],
  providers: [
    UnitLeadSyncService,
    UnitsSelfService,
    UnitsCrudService,
    UnitsMembershipService,
    UnitsRoleService,
    UnitsDirectoryService,
    UnitLeadAppointmentService,
  ],
})
export class UnitsModule {}
