import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApprovalsController } from './approvals/approvals.controller';
import { ApprovalsService } from './approvals/approvals.service';
import { IntegrationAtFourVisitsJob } from './approvals/integration-at-four-visits.job';
import { RoutingRulesController } from './routing/routing-rules.controller';
import { RoutingRulesService } from './routing/routing-rules.service';
import { FollowUpEventsRegistrar } from './events/follow-up-events.registrar';
import { FollowUpAuthService } from './services/follow-up-auth.service';

/**
 * Follow-up v2 workflow: routing rules, approvals, and the follow-up events
 * the outbox carries. The outbox and the pipeline repository are global
 * modules. FollowUpAuthService is stateless, so this module keeps its own
 * instance rather than importing FollowUpModule (which uses the routing and
 * assignment helpers here as plain functions, so there is no cycle).
 */
@Module({
  imports: [PrismaModule],
  controllers: [ApprovalsController, RoutingRulesController],
  providers: [ApprovalsService, IntegrationAtFourVisitsJob, RoutingRulesService, FollowUpEventsRegistrar, FollowUpAuthService],
  exports: [ApprovalsService],
})
export class FollowUpWorkflowModule {}
