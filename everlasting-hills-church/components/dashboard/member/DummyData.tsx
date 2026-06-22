import type { MemberHomeProps } from "@/types";

/* Dates here are ISO STRINGS (not Date objects) because MemberHomeProps types
 * every date field as `string`. Helpers build them relative to now so the
 * preview always looks current. */
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86_400_000));
const nextSundayAt = (hour: number) => {
  const d = new Date();
  const day = d.getDay();
  const until = (7 - day) % 7 || 7; // days until the next Sunday
  d.setDate(d.getDate() + until);
  d.setHours(hour, 0, 0, 0);
  return iso(d);
};

export const dummyMemberHome: MemberHomeProps = {
  member: {
    firstName: "Grace",
    lastName: "Adeyemi",
    email: "grace.adeyemi@example.com",
    phone: "+234 803 555 1212",
    address: "14 Ring Road, Ibadan, Oyo State",
    dateOfBirth: "1994-06-02",
    bio: "Choir member and Sunday school volunteer. Grateful for this church family.",
    photoUrl: null, // null → shows initials avatar
  },
  userEmail: "grace.adeyemi@example.com",
  memberDisplayId: "EHC-2024-0142",
  attendanceRate: 86,
  attendanceCount: 38,
  streakWeeks: 5,
  lastServiceDate: daysAgo(3),
  nextService: { name: "Sunday First Service", scheduledAt: nextSundayAt(8) },
  hasCheckedInToday: false,
  todayService: { id: "svc-today", name: "Sunday First Service" },
  prayerCount: 4,
  recentServices: [
    { name: "Sunday First Service", scheduledAt: daysAgo(3), totalAttended: 142 },
    { name: "Midweek Bible Study", scheduledAt: daysAgo(6), totalAttended: 73 },
    { name: "Sunday First Service", scheduledAt: daysAgo(10), totalAttended: 155 },
    { name: "Prayer Vigil", scheduledAt: daysAgo(14), totalAttended: 49 },
    { name: "Sunday First Service", scheduledAt: daysAgo(17), totalAttended: 138 },
  ],
  monthlyAttendance: [
    { label: "Dec", attended: 3, total: 5 },
    { label: "Jan", attended: 4, total: 4 },
    { label: "Feb", attended: 3, total: 4 },
    { label: "Mar", attended: 5, total: 5 },
    { label: "Apr", attended: 4, total: 4 },
    { label: "May", attended: 3, total: 4 },
  ],
  birthdayDaysUntil: 7,
  sermonStreak: 3,
  bookmarks: [
    { slug: "walking-in-faith", title: "Walking in Faith Through Trials", speaker: "Pastor Samuel Adeyemi", date: daysAgo(8), thumbnailUrl: null, audioUrl: null },
    { slug: "the-power-of-prayer", title: "The Power of Persistent Prayer", speaker: "Pastor Grace Okafor", date: daysAgo(15), thumbnailUrl: null, audioUrl: null },
    { slug: "grace-and-grit", title: "Grace and Grit", speaker: "Pastor Samuel Adeyemi", date: daysAgo(29), thumbnailUrl: null, audioUrl: null },
  ],
  listenHistory: [
    { slug: "walking-in-faith", title: "Walking in Faith Through Trials", speaker: "Pastor Samuel Adeyemi", date: daysAgo(8), thumbnailUrl: null, positionSec: 540, completed: false, audioDuration: 1800 },
    { slug: "rooted-in-the-word", title: "Rooted in the Word", speaker: "Pastor Grace Okafor", date: daysAgo(12), thumbnailUrl: null, positionSec: 2400, completed: true, audioDuration: 2400 },
    { slug: "the-power-of-prayer", title: "The Power of Persistent Prayer", speaker: "Pastor Grace Okafor", date: daysAgo(15), thumbnailUrl: null, positionSec: 300, completed: false, audioDuration: 2100 },
  ],
};