import { Injectable } from '@nestjs/common';
import { FollowUpUnitLeaderLookupService } from './follow-up-unit-leader-lookup.service';
import { FollowUpAutoSurfaceAbsenteesService } from './follow-up-auto-surface-absentees.service';
import { FollowUpAutoSurfaceFirstTimersService } from './follow-up-auto-surface-first-timers.service';

/**
 * Daily job (see SchedulingService) + a manual ADMIN+ trigger. Creates entries for
 * every at-risk absentee — in every unit they belong to, or in the fallback
 * "Follow-Up" unit if they're not on any team — and every new visitor (always
 * routed to "Follow-Up", since visitors have no unit of their own). Once a
 * (unit, person) pair has ever had an entry, it is skipped permanently — no
 * re-creation, even after a CONFIRMED outcome.
 */
@Injectable()
export class FollowUpAutoSurfaceService {
  constructor(
    private readonly unitLeaderLookup: FollowUpUnitLeaderLookupService,
    private readonly absentees: FollowUpAutoSurfaceAbsenteesService,
    private readonly firstTimers: FollowUpAutoSurfaceFirstTimersService,
  ) {}

  async autoSurfaceEntries(): Promise<{ absenteesCreated: number; firstTimersCreated: number }> {
    const leaderCache = new Map<string, string | null>();
    const followUpUnitId = await this.unitLeaderLookup.getFollowUpUnitId();
    const absenteesCreated = await this.absentees.run(leaderCache, followUpUnitId);
    const firstTimersCreated = await this.firstTimers.run(leaderCache, followUpUnitId);
    return { absenteesCreated, firstTimersCreated };
  }

  /** On-demand backfill for one specific past service — surfaces whoever was
   * absent from it and any still-unconverted first-timers from it, regardless
   * of how long ago it was or whether the daily sweep ever covered it. */
  async backfillForService(serviceId: string): Promise<{ absenteesCreated: number; firstTimersCreated: number }> {
    const leaderCache = new Map<string, string | null>();
    const followUpUnitId = await this.unitLeaderLookup.getFollowUpUnitId();
    const absenteesCreated = await this.absentees.backfillForService(serviceId, leaderCache, followUpUnitId);
    const firstTimersCreated = await this.firstTimers.backfillForService(serviceId, leaderCache, followUpUnitId);
    return { absenteesCreated, firstTimersCreated };
  }
}
