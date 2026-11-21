import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FollowUpWorkflowModule } from '../follow-up-workflow.module';
import { FollowUpAuthService } from '../services/follow-up-auth.service';
import { FirstTimerVisitsController } from './first-timer-visits.controller';
import { FirstTimerVisitsService } from './first-timer-visits.service';
import { PossibleReturnService } from './possible-return.service';

/**
 * First-timer visits and possible return visits. PipelineRepository comes
 * from the global PipelineModule; FollowUpAuthService is stateless, so this
 * module keeps its own instance rather than reaching into FollowUpModule.
 * Approvals come from the workflow module: a fourth visit asks for integration.
 */
@Module({
  imports: [PrismaModule, FollowUpWorkflowModule],
  controllers: [FirstTimerVisitsController],
  providers: [FirstTimerVisitsService, PossibleReturnService, FollowUpAuthService],
})
export class FirstTimerVisitsModule {}
