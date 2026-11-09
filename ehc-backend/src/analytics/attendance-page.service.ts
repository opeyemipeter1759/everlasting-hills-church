import { Injectable, Logger } from '@nestjs/common';
import { AttendanceOverviewService } from './attendance-overview.service';
import { AttendanceComparisonService } from './attendance-comparison.service';
import { AttendanceInsightsService } from './attendance-insights.service';
import { AttendanceAlertsService } from './attendance-alerts.service';
import type { QueryFilter } from './attendance-analytics.utils';

/** The leaderboard offers top 3, 5 or 10; sending 10 lets the page switch without refetching. */
const LEADERBOARD_TOP = 10;
const CONSISTENCY_TOP = 10;

/**
 * Everything on the Attendance Analytics page that follows the page filter, in
 * one request.
 *
 * Each part comes from the same service the old per-chart endpoint used, so the
 * numbers are unchanged. Parts run in parallel; one failing leaves it null and
 * listed in `unavailable` instead of failing the whole page.
 *
 * The heatmap (its own year picker) and the period comparison (its own two
 * periods) are not here: they change independently of the page filter, and
 * folding them in would refetch every chart whenever one of them changed.
 */
@Injectable()
export class AttendancePageService {
  private readonly logger = new Logger(AttendancePageService.name);

  constructor(
    private readonly overview: AttendanceOverviewService,
    private readonly comparison: AttendanceComparisonService,
    private readonly insights: AttendanceInsightsService,
    private readonly alerts: AttendanceAlertsService,
  ) {}

  async load(filter: QueryFilter) {
    const unavailable: string[] = [];
    const part = <T>(name: string, run: () => Promise<T> | T): Promise<T | null> =>
      Promise.resolve()
        .then(run)
        .catch((err: unknown) => {
          this.logger.warn(`Attendance analytics part "${name}" failed: ${(err as Error)?.message ?? err}`);
          unavailable.push(name);
          return null;
        });
    // Service comparison and member growth have never been split by service
    // type — they compare across services — so they get the filter without it.
    const allServices: QueryFilter = { ...filter, serviceType: undefined };

    const [
      overview, trend, split, rateTrend, absenteeTrend, serviceComparison, memberGrowth,
      leaderboard, firstTimers, retention, peakHours, consistency, serviceHealth, alerts,
    ] = await Promise.all([
      part('overview', () => this.overview.getOverview(filter)),
      part('trend', () => this.overview.getTrend(filter)),
      part('split', () => this.overview.getSplit(filter)),
      part('rateTrend', () => this.overview.getRateTrend(filter)),
      part('absenteeTrend', () => this.overview.getAbsenteeTrend(filter)),
      part('serviceComparison', () => this.comparison.getServiceComparison(allServices)),
      part('memberGrowth', () => this.comparison.getMemberGrowth(allServices)),
      part('leaderboard', () => this.comparison.getLeaderboard(filter, LEADERBOARD_TOP)),
      part('firstTimers', () => this.insights.getFirstTimers(filter)),
      part('retention', () => this.insights.getRetention(filter)),
      part('peakHours', () => this.insights.getPeakHours(filter)),
      part('consistency', () => this.alerts.getConsistency(filter, CONSISTENCY_TOP)),
      part('serviceHealth', () => this.alerts.getServiceHealth()),
      part('alerts', () => this.alerts.getAlerts()),
    ]);

    return {
      overview, trend, split, rateTrend, absenteeTrend, serviceComparison, memberGrowth,
      leaderboard, firstTimers, retention, peakHours, consistency, serviceHealth, alerts,
      unavailable,
    };
  }
}
