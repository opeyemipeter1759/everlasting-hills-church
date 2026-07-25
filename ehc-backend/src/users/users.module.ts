import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersRolesController } from './users-roles.controller';
import { UsersGrantsController } from './users-grants.controller';
import { UsersSupabaseAdminService } from './services/users-supabase-admin.service';
import { UsersAuthService } from './services/users-auth.service';
import { UsersRoleGrantsService } from './services/users-role-grants.service';
import { UsersRolesOverviewService } from './services/users-roles-overview.service';
import { UsersListByRoleService } from './services/users-list-by-role.service';
import { UsersListService } from './services/users-list.service';
import { UsersCreateService } from './services/users-create.service';
import { UsersBulkCreateService } from './services/users-bulk-create.service';
import { UsersUpdateService } from './services/users-update.service';
import { UsersDeletionService } from './services/users-deletion.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController, UsersRolesController, UsersGrantsController],
  providers: [
    UsersSupabaseAdminService,
    UsersAuthService,
    UsersRoleGrantsService,
    UsersRolesOverviewService,
    UsersListByRoleService,
    UsersListService,
    UsersCreateService,
    UsersBulkCreateService,
    UsersUpdateService,
    UsersDeletionService,
  ],
})
export class UsersModule {}
