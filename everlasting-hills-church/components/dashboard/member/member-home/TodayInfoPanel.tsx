import type { MemberHomeProps } from "./types";
import {
  TodayAttendanceRecorded,
  TodayNextServiceCountdown,
  TodayFeaturedSermonTeaser,
} from "./TodayServiceStates";
import { TodayAnnouncementsList } from "./TodayAnnouncementsList";
import { TodayStayConnected } from "./TodayStayConnected";

export function TodayInfoPanel({
  nextService, isServiceDay, hasCheckedIn, featuredSermon, announcements,
}: {
  nextService: MemberHomeProps["nextService"];
  isServiceDay: boolean;
  hasCheckedIn: boolean;
  featuredSermon: MemberHomeProps["featuredSermon"];
  announcements: Array<{ id: string; title: string; body: string; createdAt: string }>;
}) {
  if (isServiceDay && hasCheckedIn) {
    return <TodayAttendanceRecorded />;
  }

  if (!isServiceDay && nextService) {
    return <TodayNextServiceCountdown nextService={nextService} />;
  }

  if (featuredSermon) {
    return <TodayFeaturedSermonTeaser featuredSermon={featuredSermon} />;
  }

  if (announcements.length > 0) {
    return <TodayAnnouncementsList announcements={announcements} />;
  }

  return <TodayStayConnected />;
}
