import type { MemberHomePropsOptional } from "@/components/dashboard/member/member-home/types";
import { daysUntilBirthday } from "@/lib/birthday";
import { getMemberDisplayId } from "../shared";
import type { MemberHomeData } from "./types";

/** Birthdays are celebrated on the home page from a week out. */
const BIRTHDAY_WINDOW_DAYS = 7;

/**
 * The home page's props from the /member-home answer. Anything missing is
 * left out, so MemberHome's own defaults apply instead of placeholders here.
 */
export function toMemberHomeProps(data: MemberHomeData | null): MemberHomePropsOptional {
  if (!data) return {};
  const member = data.me?.member ?? null;
  const attendance = data.overview?.attendance;
  const daysUntil = daysUntilBirthday(member?.dateOfBirth);

  return {
    member: member && {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      address: member.address,
      dateOfBirth: member.dateOfBirth?.split("T")[0] ?? null,
      bio: member.bio,
      photoUrl: member.photoUrl,
    },
    userEmail: member?.email ?? "",
    memberDisplayId: getMemberDisplayId(member?.id),
    birthdayDaysUntil: daysUntil !== null && daysUntil <= BIRTHDAY_WINDOW_DAYS ? daysUntil : null,

    attendanceRate: attendance?.percentage ?? 0,
    attendanceCount: attendance?.marked ?? 0,
    attendanceTotal: attendance?.total ?? 0,
    lastServiceDate: attendance?.lastMarkedAt ?? null,
    ...(data.overview && {
      streak: data.overview.streak,
      coursesCompleted: data.overview.coursesCompleted,
      sermonsCompleted: data.overview.sermonsCompleted,
    }),

    sermonStreak: data.sermonStreak ?? 0,
    bookmarks: (data.bookmarks ?? []).map(({ Sermon: s }) => ({
      slug: s.slug,
      title: s.title,
      speaker: s.speaker,
      date: s.date,
      thumbnailUrl: s.thumbnailUrl,
      audioUrl: s.audioUrl,
    })),
    listenHistory: (data.listenHistory ?? []).map(({ Sermon: s, positionSec, completed }) => ({
      slug: s.slug,
      title: s.title,
      speaker: s.speaker,
      date: s.date,
      thumbnailUrl: s.thumbnailUrl,
      positionSec,
      completed,
      audioDuration: s.audioDuration,
    })),

    announcements: data.announcements ?? [],
    communityFeed: data.communityFeed ?? [],
    communityBirthdays: data.communityBirthdays ?? [],
  };
}
