import { Injectable, Logger } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user';
import { AuthMeService } from '../auth/services/auth-me.service';
import { SermonMemberStatsService } from '../sermons/services/sermon-member-stats.service';
import { OverviewService } from '../overview/overview.service';
import { AnnouncementsService } from '../announcements/announcements.service';
import { CommunityService } from '../community/community.service';
import { MemberBirthdaysService } from '../members/services/member-birthdays.service';
import { MemberSpouseService } from '../members/services/member-spouse.service';
import { PledgeService } from '../forms/services/pledge.service';
import { EvangelismAccessService } from '../evangelism/services/evangelism-access.service';
import { PrayerWatchService } from '../prayer-watch/prayer-watch.service';
import { OneOnOneRequestsService } from '../one-on-one/one-on-one-requests.service';
import { MeReadingPlanService } from '../reading-plan/services/me-reading-plan.service';
import { DailyScriptureService } from '../reading-plan/services/daily-scripture.service';
import { BiblePassageService } from '../reading-plan/services/bible-passage.service';
import { AttendanceSessionWindowService } from '../attendance/services/attendance-session-window.service';
import { GatheringsService } from '../gatherings/gatherings.service';
import { SermonDigestService } from '../sermon-digest/sermon-digest.service';

/** The pledge drive the home page appeals for. */
export const HOME_PLEDGE_CAMPAIGN = 'sound-media';
/** Birthdays shown on the home page: the coming week. */
const BIRTHDAY_DAYS_AHEAD = 7;

const NO_TALLY = { reached: 0, saved: 0, rededicated: 0, alreadySaved: 0, thisYear: { reached: 0, saved: 0 }, lastContactDate: null };

/**
 * Everything the member dashboard's home page shows, in one request.
 *
 * Each section comes from the same service its own endpoint uses, so the
 * numbers agree with every other page. Sections load in parallel, and one
 * failing (a slow scripture source, say) leaves that section null instead of
 * failing the whole page. Failed sections are listed in `unavailable`, so the
 * page can tell "this failed, fetch it again" apart from "there is nothing"
 * (no prayer-watch sign-up, no pledge), which is also null.
 */
@Injectable()
export class MemberHomeService {
  private readonly logger = new Logger(MemberHomeService.name);

  constructor(
    private readonly authMe: AuthMeService,
    private readonly sermonStats: SermonMemberStatsService,
    private readonly overview: OverviewService,
    private readonly announcements: AnnouncementsService,
    private readonly community: CommunityService,
    private readonly birthdays: MemberBirthdaysService,
    private readonly spouse: MemberSpouseService,
    private readonly pledges: PledgeService,
    private readonly evangelism: EvangelismAccessService,
    private readonly prayerWatch: PrayerWatchService,
    private readonly oneOnOne: OneOnOneRequestsService,
    private readonly readingPlan: MeReadingPlanService,
    private readonly scripture: DailyScriptureService,
    private readonly passages: BiblePassageService,
    private readonly attendanceWindow: AttendanceSessionWindowService,
    private readonly gatherings: GatheringsService,
    private readonly digest: SermonDigestService,
  ) {}

  async load(actor: AuthUser) {
    const unavailable: string[] = [];
    const section = <T>(name: string, run: () => Promise<T> | T): Promise<T | null> =>
      Promise.resolve()
        .then(run)
        .catch((err: unknown) => {
          this.logger.warn(`Home section "${name}" failed: ${(err as Error)?.message ?? err}`);
          unavailable.push(name);
          return null;
        });

    const [
      me, bookmarks, listenHistory, sermonStreak, overview, announcements, communityFeed, communityBirthdays,
      spouse, pledge, evangelismTally, prayerWatch, prayerWatchCurrent, oneOnOneRequests, readingToday, readingSubscriptions,
      canMark, gatherings, scriptureToday, scriptureTranslations, latestSermon,
    ] = await Promise.all([
      section('me', () => this.authMe.getMe(actor.userId)),
      section('bookmarks', () => this.sermonStats.getMemberBookmarks(actor.userId)),
      section('listenHistory', () => this.sermonStats.getMemberListenHistory(actor.userId)),
      section('sermonStreak', () => this.sermonStats.getSermonStreak(actor.userId)),
      section('overview', () => this.overview.getMemberOverview(actor.userId)),
      section('announcements', () => this.announcements.listFeed()),
      section('communityFeed', () => this.community.getFeed()),
      section('communityBirthdays', () => this.birthdays.getCommunityBirthdays(BIRTHDAY_DAYS_AHEAD)),
      section('spouse', () => this.spouse.mine(actor.userId, actor.email)),
      section('pledge', () => this.pledges.mine(actor, HOME_PLEDGE_CAMPAIGN)),
      section('evangelismTally', () => (actor.memberId ? this.evangelism.tally(actor.memberId) : NO_TALLY)),
      section('prayerWatch', () => (actor.profileId ? this.prayerWatch.getMySignup(actor.profileId) : null)),
      // Every watch of the night, so the card can show where theirs falls.
      section('prayerWatchCurrent', () => this.prayerWatch.getPublicView()),
      section('oneOnOneRequests', () => this.oneOnOne.listMine(actor)),
      section('readingToday', () => this.readingPlan.today(actor, undefined)),
      section('readingSubscriptions', () => this.readingPlan.subscriptions(actor)),
      section('canMark', () => this.attendanceWindow.canMark(actor.userId)),
      section('gatherings', () => this.gatherings.listActive()),
      section('scriptureToday', () => this.scripture.today(undefined)),
      section('scriptureTranslations', () => this.passages.translations(undefined)),
      section('latestSermon', async () => {
        const latest = await this.digest.latest();
        return latest ? { ready: true as const, ...latest } : { ready: false as const };
      }),
    ]);

    return {
      me, bookmarks, listenHistory, sermonStreak, overview, announcements, communityFeed, communityBirthdays,
      spouse, pledge, evangelismTally, prayerWatch, prayerWatchCurrent, oneOnOneRequests,
      readingPlan: { today: readingToday, subscriptions: readingSubscriptions },
      canMark, gatherings,
      scripture: { today: scriptureToday, translations: scriptureTranslations },
      latestSermon,
      pledgeCampaign: HOME_PLEDGE_CAMPAIGN,
      unavailable,
    };
  }
}
