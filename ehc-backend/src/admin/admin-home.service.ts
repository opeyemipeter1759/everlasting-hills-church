import { Injectable, Logger } from '@nestjs/common';
import { FollowUpStage, Role } from '@prisma/client';
import type { AuthUser } from '../auth/types/auth-user';
import { meetsRole } from '../auth/guards/roles.guard';
import { AnalyticsService } from '../analytics/analytics.service';
import { CmsAuditService } from '../cms/services/cms-audit.service';
import { EventsService } from '../events/events.service';
import { FollowUpReadService } from '../follow-up/services/follow-up-read.service';
import { MemberBirthdaysService } from '../members/services/member-birthdays.service';
import { MemberPastoralCareService } from '../members/services/member-pastoral-care.service';
import { MemberRiskService } from '../members/services/member-risk.service';
import { AdminService } from './admin.service';

/** Every recorded headcount; the chart filters by date range itself. */
const TREND_POINTS = 500;
const BIRTHDAY_DAYS_AHEAD = 7;
/** Members flagged for follow-up after this many Sundays away. */
const MISSED_SUNDAYS = 3;
const RECENT_ACTIVITY = 10;

/**
 * Everything the admin dashboard's overview shows, in one request.
 *
 * Each part comes from the same service its own page uses, so the numbers
 * agree. Parts load in parallel; one failing leaves it null and listed in
 * `unavailable` instead of failing the whole dashboard.
 *
 * Giving and the CMS audit log are PASTOR+ everywhere else, so an admin below
 * that gets them as null (and not in `unavailable`) — the page hides those cards.
 */
@Injectable()
export class AdminHomeService {
  private readonly logger = new Logger(AdminHomeService.name);

  constructor(
    private readonly admin: AdminService,
    private readonly analytics: AnalyticsService,
    private readonly birthdays: MemberBirthdaysService,
    private readonly pastoralCare: MemberPastoralCareService,
    private readonly risk: MemberRiskService,
    private readonly followUps: FollowUpReadService,
    private readonly events: EventsService,
    private readonly audit: CmsAuditService,
  ) {}

  async load(actor: AuthUser) {
    const unavailable: string[] = [];
    const part = <T>(name: string, run: () => Promise<T> | T): Promise<T | null> =>
      Promise.resolve()
        .then(run)
        .catch((err: unknown) => {
          this.logger.warn(`Admin home part "${name}" failed: ${(err as Error)?.message ?? err}`);
          unavailable.push(name);
          return null;
        });
    const pastorOnly = <T>(name: string, run: () => Promise<T>) =>
      meetsRole(actor.effectiveRoles, Role.PASTOR) ? part(name, run) : Promise.resolve(null);

    const [
      summary, attendanceTrend, upcomingBirthdays, anniversariesToday, givingSummary, givingCategories,
      unassignedFollowUps, analytics, openFollowUpTasks, atRisk, units, recentActivity, absentMembers, calendar,
    ] = await Promise.all([
      part('summary', () => this.admin.getDashboardSummary()),
      part('attendanceTrend', () => this.admin.getAttendanceTrend(TREND_POINTS)),
      part('upcomingBirthdays', () => this.birthdays.getUpcomingBirthdays(BIRTHDAY_DAYS_AHEAD)),
      part('anniversariesToday', () => this.birthdays.getTodayAnniversaries()),
      pastorOnly('givingSummary', () => this.analytics.getGivingSummary()),
      pastorOnly('givingCategories', () => this.analytics.getGivingByCategory()),
      part('unassignedFollowUps', async () => (await this.followUps.list(actor, { stage: FollowUpStage.UNASSIGNED })).length),
      part('analytics', () => this.analytics.getAdminAnalytics()),
      part('openFollowUpTasks', async () => (await this.pastoralCare.listOpenFollowUpTasks()).length),
      part('atRisk', () => this.risk.getMembersAtRisk()),
      part('units', () => this.analytics.getDepartmentStats()),
      pastorOnly('recentActivity', () => this.audit.list(RECENT_ACTIVITY)),
      part('absentMembers', () => this.pastoralCare.getAbsentMembers(MISSED_SUNDAYS)),
      part('calendar', () => this.events.calendarSummary()),
    ]);

    return {
      summary, attendanceTrend, upcomingBirthdays, anniversariesToday, givingSummary, givingCategories,
      unassignedFollowUps, analytics, openFollowUpTasks, atRisk, units, recentActivity, absentMembers, calendar,
      unavailable,
    };
  }
}
