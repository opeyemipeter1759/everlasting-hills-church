import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersOnboardingController } from './controllers/members-onboarding.controller';
import { MembersSelfServiceController } from './controllers/members-self-service.controller';
import { MembersPastoralController } from './controllers/members-pastoral.controller';
import { MembersBirthdayGreetingsController } from './controllers/members-birthday-greetings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MemberOnboardingService } from './services/member-onboarding.service';
import { MemberAuthProvisioningService } from './services/member-auth-provisioning.service';
import { MemberBulkImportService } from './services/member-bulk-import.service';
import { MemberHouseholdService } from './services/member-household.service';
import { MemberBulkOpsService } from './services/member-bulk-ops.service';
import { MemberSelfLookupService } from './services/member-self-lookup.service';
import { MemberProfileService } from './services/member-profile.service';
import { MemberAvatarService } from './services/member-avatar.service';
import { MemberDeactivationService } from './services/member-deactivation.service';
import { MemberSearchService } from './services/member-search.service';
import { MemberRoleResolverService } from './services/member-role-resolver.service';
import { MemberDirectoryQueryService } from './services/member-directory-query.service';
import { MemberDirectoryService } from './services/member-directory.service';
import { MemberExportService } from './services/member-export.service';
import { MemberCrudService } from './services/member-crud.service';
import { MemberDeletionService } from './services/member-deletion.service';
import { MemberBirthdaysService } from './services/member-birthdays.service';
import { BirthdayGreetingsService } from './services/birthday-greetings.service';
import { MemberPastoralCareService } from './services/member-pastoral-care.service';
import { MemberRiskService } from './services/member-risk.service';

@Module({
  imports: [PrismaModule, AuthModule],
  // Order matters: MembersController owns the GET /:id catch-all, so it must be
  // registered last — otherwise it would swallow specific routes like /search,
  // /absent, /at-risk, /follow-ups declared on the other controllers below.
  controllers: [
    MembersOnboardingController,
    MembersSelfServiceController,
    MembersPastoralController,
    MembersBirthdayGreetingsController,
    MembersController,
  ],
  providers: [
    MemberOnboardingService,
    MemberAuthProvisioningService,
    MemberBulkImportService,
    MemberHouseholdService,
    MemberBulkOpsService,
    MemberSelfLookupService,
    MemberProfileService,
    MemberAvatarService,
    MemberDeactivationService,
    MemberSearchService,
    MemberRoleResolverService,
    MemberDirectoryQueryService,
    MemberDirectoryService,
    MemberExportService,
    MemberCrudService,
    MemberDeletionService,
    MemberBirthdaysService,
    BirthdayGreetingsService,
    MemberPastoralCareService,
    MemberRiskService,
  ],
})
export class MembersModule {}
