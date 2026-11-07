import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SermonsModule } from '../sermons/sermons.module';
import { OverviewModule } from '../overview/overview.module';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { CommunityModule } from '../community/community.module';
import { MembersModule } from '../members/members.module';
import { FormsModule } from '../forms/forms.module';
import { EvangelismModule } from '../evangelism/evangelism.module';
import { PrayerWatchModule } from '../prayer-watch/prayer-watch.module';
import { OneOnOneModule } from '../one-on-one/one-on-one.module';
import { ReadingPlanModule } from '../reading-plan/reading-plan.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { GatheringsModule } from '../gatherings/gatherings.module';
import { SermonDigestModule } from '../sermon-digest/sermon-digest.module';
import { MemberHomeController } from './member-home.controller';
import { MemberHomeService } from './member-home.service';

/** The member dashboard home page's single request, built from each feature's own service. */
@Module({
  imports: [
    AuthModule,
    SermonsModule,
    OverviewModule,
    AnnouncementsModule,
    CommunityModule,
    MembersModule,
    FormsModule,
    EvangelismModule,
    PrayerWatchModule,
    OneOnOneModule,
    ReadingPlanModule,
    AttendanceModule,
    GatheringsModule,
    SermonDigestModule,
  ],
  controllers: [MemberHomeController],
  providers: [MemberHomeService],
})
export class MemberHomeModule {}
