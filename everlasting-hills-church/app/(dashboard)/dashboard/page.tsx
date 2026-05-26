import MemberHome from "@/components/dashboard/member/MemberHome";
import { serverApi, type ApiError } from "@/lib/api/server";

export const metadata = { title: "Dashboard — Everlasting Hills Church" };

/**
 * Dashboard landing.
 *
 * Server Component — runs once per request on the Node side, no client-side waterfall.
 * Middleware already enforced JWT auth + minimum role (MEMBER) before this renders.
 *
 * Data we can serve TODAY (real backend):
 *   - /auth/me              → profile + linked member info (firstName, photoUrl, dob, etc.)
 *   - /sermons/me/bookmarks → saved sermons
 *   - /sermons/me/history   → continue-listening list
 *   - /sermons/me/streak    → weekly listening streak count
 *
 * Data still pending NestJS modules (left as undefined → MemberHome's dummy fallback or
 * empty-state UI takes over for that section):
 *   - attendance rate / streak / records / monthly chart
 *   - today's service, next service, has-checked-in-today
 *   - prayer count, recent services
 *
 * Once the Attendance/Services modules ship in Week 3, swap these for real /attendance/me
 * and /services/upcoming calls — the component's prop contract is already correct.
 */
export const dynamic = "force-dynamic"; // depends on per-request cookies

interface MeResponse {
  profileId: string | null;
  role: string | null;
  tenantId: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: string | null;
    bio: string | null;
    photoUrl: string | null;
    joinedAt: string;
  } | null;
}

interface SermonBookmark {
  Sermon: {
    slug: string;
    title: string;
    speaker: string;
    date: string;
    thumbnailUrl: string | null;
    audioUrl: string | null;
  };
}

interface ListenHistoryItem {
  positionSec: number;
  completed: boolean;
  Sermon: {
    slug: string;
    title: string;
    speaker: string;
    date: string;
    thumbnailUrl: string | null;
    audioDuration: number | null;
  };
}

/** EHC-XXXX display ID derived from the member UUID's tail. */
function getMemberDisplayId(id: string | null | undefined): string {
  if (!id) return "EHC-NEW";
  return `EHC-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

/**
 * Returns null on auth/network failure rather than throwing so a transient backend hiccup
 * degrades to dummy data instead of an error page.
 */
async function safeGet<T>(path: string): Promise<T | null> {
  try {
    return await serverApi.get<T>(path, { cache: "no-store" });
  } catch (err) {
    const status = (err as ApiError).status;
    // 401/403 happen for orphan accounts (Supabase user with no Profile) — caller handles
    if (status === 401 || status === 403 || status === 404) return null;
    // Anything else: log and degrade gracefully
    console.error(`[dashboard] ${path} failed:`, (err as Error).message ?? err);
    return null;
  }
}

export default async function DashboardPage() {
  // Parallel fetches — single round-trip to the backend network-wise on warm connections
  const [me, bookmarksRaw, historyRaw, streakRaw] = await Promise.all([
    safeGet<MeResponse>("/auth/me"),
    safeGet<SermonBookmark[]>("/sermons/me/bookmarks"),
    safeGet<ListenHistoryItem[]>("/sermons/me/history"),
    safeGet<number>("/sermons/me/streak"),
  ]);

  const member = me?.member ?? null;
  const userEmail = member?.email ?? "";
  const memberDisplayId = getMemberDisplayId(member?.id);

  // Map Prisma relation names (PascalCase) to the UI prop shape MemberHome expects.
  // Will be replaced by OpenAPI-generated types in Week 3.
  const bookmarks =
    bookmarksRaw?.map((b) => ({
      slug: b.Sermon.slug,
      title: b.Sermon.title,
      speaker: b.Sermon.speaker,
      date: b.Sermon.date,
      thumbnailUrl: b.Sermon.thumbnailUrl,
      audioUrl: b.Sermon.audioUrl,
    })) ?? [];

  const listenHistory =
    historyRaw?.map((p) => ({
      slug: p.Sermon.slug,
      title: p.Sermon.title,
      speaker: p.Sermon.speaker,
      date: p.Sermon.date,
      thumbnailUrl: p.Sermon.thumbnailUrl,
      positionSec: p.positionSec,
      completed: p.completed,
      audioDuration: p.Sermon.audioDuration,
    })) ?? [];

  const sermonStreak = typeof streakRaw === "number" ? streakRaw : 0;

  // ── Birthday banner: derive days-until from member.dateOfBirth (within next 7) ──────
  let birthdayDaysUntil: number | null = null;
  if (member?.dateOfBirth) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dob = new Date(member.dateOfBirth);
    const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86_400_000);
    if (diff >= 0 && diff <= 7) birthdayDaysUntil = diff;
  }

  return (
    <MemberHome
      member={
        member
          ? {
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email,
              phone: member.phone,
              address: member.address,
              dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split("T")[0] : null,
              bio: member.bio,
              photoUrl: member.photoUrl,
            }
          : undefined
      }
      userEmail={userEmail}
      memberDisplayId={memberDisplayId}
      sermonStreak={sermonStreak}
      bookmarks={bookmarks}
      listenHistory={listenHistory}
      birthdayDaysUntil={birthdayDaysUntil}
      // The fields below are intentionally undefined until the Attendance/Services modules
      // ship — MemberHome falls back to its bundled dummy data for these sections so the
      // page still renders fully populated rather than showing empty states everywhere.
      //   attendanceRate, attendanceCount, streakWeeks, lastServiceDate, nextService,
      //   hasCheckedInToday, todayService, prayerCount, recentServices, monthlyAttendance
    />
  );
}
