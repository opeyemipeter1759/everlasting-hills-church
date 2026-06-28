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
  todayService: { id: "svc-today", name: "Sunday First Service", sermonTitle: "Pressing Toward the Mark" },
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
  announcements: [
    {
      id: "ann-1",
      title: "Youth Camp Registration Open",
      body: "Registration is now open for the 2024 EHC Youth Camp. Spaces are limited — register before June 30th to secure your spot.",
      createdAt: daysAgo(1),
    },
    {
      id: "ann-2",
      title: "Midweek Prayer Night — This Wednesday",
      body: "Join us for an extended prayer night this Wednesday at 5:30 PM. Come ready to seek God together.",
      createdAt: daysAgo(3),
    },
  ],
  communityBirthdays: [
    { firstName: "Bukola", lastName: "Adewale", photoUrl: null },
    { firstName: "Emeka", lastName: "Obi", photoUrl: null },
  ],
  ministryUnit: { name: "Ushering Team", nextServingDate: nextSundayAt(8) },
  featuredSermon: {
    slug: "walking-in-faith",
    title: "Walking in Faith Through Trials",
    speaker: "Pastor Samuel Adeyemi",
    date: daysAgo(6),
    thumbnailUrl: null,
    audioUrl: null,
    description: "In this powerful message, Pastor Samuel walks us through James 1 and reveals how trials, when embraced with faith, produce a character that nothing else can build.",
  },
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

  pastorWord: {
    text: "God does not call the qualified — He qualifies the called. Whatever you face today, remember that He who began a good work in you will carry it to completion. Step forward in faith, not fear.",
    audioUrl: null,
  },
  dailyPrayer: "Lord, align my heart with Your will for today. Let every step I take be ordered by You, and may I be a light to everyone I encounter this day.",
  communityFeed: [
    {
      id: "feed-1",
      authorName: "Adaeze Nwosu",
      authorPhotoUrl: null,
      text: "God showed up mightily in last Sunday's service! The message on faith completely transformed my perspective. Grateful for this family 🙏",
      createdAt: daysAgo(1),
      reactions: 24,
    },
    {
      id: "feed-2",
      authorName: "Tobi Fashola",
      authorPhotoUrl: null,
      text: "Reminder: Youth intercessory prayer is this Saturday at 7 AM. Come with expectation — God is moving!",
      createdAt: daysAgo(2),
      reactions: 18,
    },
    {
      id: "feed-3",
      authorName: "Chinwe Eze",
      authorPhotoUrl: null,
      text: "Just completed the Membership Class today. What an eye-opening experience. Thank you to everyone who made it possible. 🎉",
      createdAt: daysAgo(3),
      reactions: 31,
    },
  ],
  onlineCount: 14,
  discipleshipMilestones: [
    { label: "Water Baptism", completedAt: daysAgo(365) },
    { label: "Membership Class", completedAt: daysAgo(90) },
    { label: "Leadership Training", completedAt: null },
  ],
  memberSince: daysAgo(365 * 3),
  anniversaryDaysUntil: null,
};