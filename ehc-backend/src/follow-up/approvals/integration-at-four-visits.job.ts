import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApprovalsService } from './approvals.service';

/**
 * Came again and a confirmed return visit put someone forward for integration
 * straight away. A visit can also come from a service check-in once they have
 * an account, so this sweeps up anyone who reached four visits that way.
 */
@Injectable()
export class IntegrationAtFourVisitsJob {
  private readonly logger = new Logger(IntegrationAtFourVisitsJob.name);

  constructor(private readonly approvals: ApprovalsService) {}

  @Cron('0 10 * * *', { name: 'follow-up-integration-at-four-visits', timeZone: 'Africa/Lagos' })
  async run(): Promise<void> {
    try {
      const raised = await this.approvals.requestAtFourVisits();
      if (raised) this.logger.log(`Put ${raised} first-timer(s) forward for integration after four visits`);
    } catch (err) {
      this.logger.error(`Integration at four visits failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
