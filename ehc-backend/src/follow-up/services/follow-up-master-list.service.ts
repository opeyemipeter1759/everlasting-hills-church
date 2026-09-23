import { Injectable } from '@nestjs/common';
import { FollowUpRollService } from './follow-up-roll.service';
import { matchesFilters, type MasterListFilters } from './master-list-filter.util';

/**
 * Everyone the church is responsible for, narrowed and paged. First-timers
 * come first — they exist only as a form somebody filled in, which makes them
 * the easiest people to forget, and not forgetting anyone is the point.
 *
 * Filtering happens here rather than in SQL because a person's status is
 * worked out in code, which keeps the totals and the paging honest instead of
 * counting only what happens to be on the current page.
 */
@Injectable()
export class FollowUpMasterListService {
  constructor(private readonly roll: FollowUpRollService) {}

  async list(opts: MasterListFilters) {
    const everyone = await this.roll.everyone(opts.search ?? '');
    const matching = everyone.filter((row) => matchesFilters(row, opts));
    const take = Math.min(opts.take, 200);

    return {
      data: matching.slice(opts.skip, opts.skip + take),
      meta: { total: matching.length, take: opts.take, skip: opts.skip },
    };
  }
}
