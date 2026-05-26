import MemberHome from "@/components/dashboard/member/MemberHome";
import AdminOverview from "@/components/dashboard/AdminOverview";
import UnitLeadHome from "@/components/dashboard/UnitLeadHome";
import { serverApi, type ApiError } from "@/lib/api/server";

export const metadata = { title: "Dashboard — Everlasting Hills Church" };
export const dynamic = "force-dynamic"; // per-request cookies

/**
 * Dashboard landing.
 *
 * Branches on role:
 *   MEMBER     → MemberHome (personal data: bookmarks, sermon streak, attendance fallback)
 *   UNIT_LEAD  → UnitLeadHome (their unit's stats)
 *   ADMIN+     → AdminOverview (church-wide metrics)
 *
 * Each branch fetches ONLY the endpoints it needs, in parallel — no role pays for data
 * another role needs. Middleware already enforced JWT + minimum role (MEMBER).
 *
 * All fetches use `safeGet`: a transient backend hiccup degrades to a partial UI rather
 * than a 500 page. This trades correctness for resilience — admins still see the dashboard
 * even if one analytics query is slow.
 */

// ── /auth/me shape ────────────────────────────────────────────────────────────
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

// ── Sermon shapes (existing endpoints) ────────────────────────────────────────
interface SermonBookmark {
  Sermon: { slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; audioUrl: string | null };
}
interface ListenHistoryItem {
  positionSec: number;
  completed: boolean;
  Sermon: { slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; audioDuration: number | null };
}

// ── Admin analytics shapes ────────────────────────────────────────────────────
interface AdminAnalytics {
  totalMembers: number;
  totalVisitors: number;
  totalPrayers: number;
  totalGivingNaira: number;
  avgAttendance: number;
  newMembersThisMonth: number;
}
interface AttendanceStats {
  totalServices: number;
  todayCheckIns: number;
}
interface MemberRowApi {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  joinedAt: string;
}
interface BirthdayRowApi {
  id: string;
  firstName: string;
  lastName: string;
  daysUntil: number;
  photoUrl: string | null;
}
interface AbsentRowApi {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getMemberDisplayId(id: string | null | undefined): string {
  if (!id) return "EHC-NEW";
  return `EHC-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    return await serverApi.get<T>(path, { cache: "no-store" });
  } catch (err) {
    const status = (err as ApiError).status;
    if (status === 401 || status === 403 || status === 404) return null;
    console.error(`[dashboard] ${path} failed:`, (err as Error).message ?? err);
    return null;
  }
}

function normalizeRole(role: string | null | undefined): "MEMBER" | "UNIT_LEAD" | "ADMIN" | "PASTOR" | "SUPER_ADMIN" | null {
  if (!role) return null;
  const upper = role.toUpperCase();
  if (upper === "MEMBER" || upper === "UNIT_LEAD" || upper === "ADMIN" || upper === "PASTOR" || upper === "SUPER_ADMIN") return upper;
  return null;
}

// ── Per-role data loaders ─────────────────────────────────────────────────────

async function loadMemberDashboard(me: MeResponse) {
  const [bookmarksRaw, historyRaw, streakRaw] = await Promise.all([
    safeGet<SermonBookmark[]>("/sermons/me/bookmarks"),
    safeGet<ListenHistoryItem[]>("/sermons/me/history"),
    safeGet<number>("/sermons/me/streak"),
  ]);

  const bookmarks = bookmarksRaw?.map((b) => ({
    slug: b.Sermon.slug,
    title: b.Sermon.title,
    speaker: b.Sermon.speaker,
    date: b.Sermon.date,
    thumbnailUrl: b.Sermon.thumbnailUrl,
    audioUrl: b.Sermon.audioUrl,
  })) ?? [];

  const listenHistory = historyRaw?.map((p) => ({
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

  // Birthday: derive days-until from DOB if within next 7
  let birthdayDaysUntil: number | null = null;
  if (me.member?.dateOfBirth) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dob = new Date(me.member.dateOfBirth);
    const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86_400_000);
    if (diff >= 0 && diff <= 7) birthdayDaysUntil = diff;
  }

  return (
    <MemberHome
      member={
        me.member
          ? {
              firstName: me.member.firstName,
              lastName: me.member.lastName,
              email: me.member.email,
              phone: me.member.phone,
              address: me.member.address,
              dateOfBirth: me.member.dateOfBirth ? me.member.dateOfBirth.split("T")[0] : null,
              bio: me.member.bio,
              photoUrl: me.member.photoUrl,
            }
          : undefined
      }
      userEmail={me.member?.email ?? ""}
      memberDisplayId={getMemberDisplayId(me.member?.id)}
      sermonStreak={sermonStreak}
      bookmarks={bookmarks}
      listenHistory={listenHistory}
      birthdayDaysUntil={birthdayDaysUntil}
    />
  );
}

async function loadAdminDashboard(me: MeResponse) {
  // Parallel fetches across the analytics + members + attendance modules.
  const [analytics, attendanceStats, members, birthdaysRaw, absentRaw] = await Promise.all([
    safeGet<AdminAnalytics>("/admin/analytics"),
    safeGet<AttendanceStats>("/attendance/stats"),
    safeGet<MemberRowApi[]>("/members?status=ACTIVE"),
    safeGet<BirthdayRowApi[]>("/members/birthdays/upcoming?daysAhead=7"),
    safeGet<AbsentRowApi[]>("/members/absent?missedSundays=3"),
  ]);

  // Convert ISO strings to Date objects to match the component's prop contract.
  const recentMembers = (members ?? []).slice(0, 10).map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phone,
    joinedAt: new Date(m.joinedAt),
  }));

  // TODO: recentVisitors — no /visitors endpoint exists yet on NestJS. Empty for now.
  // Week 3 follow-up: add GET /visitors to the forms or a new visitors module.
  return (
    <AdminOverview
      userName={me.member?.firstName ?? null}
      stats={{
        members: analytics?.totalMembers ?? 0,
        visitors: analytics?.totalVisitors ?? 0,
        todayCheckIns: attendanceStats?.todayCheckIns ?? 0,
        prayers: analytics?.totalPrayers ?? 0,
      }}
      recentVisitors={[]}
      recentMembers={recentMembers}
      memberEmails={recentMembers.map((m) => m.email).filter((e): e is string => !!e)}
      birthdayFeed={birthdaysRaw ?? []}
      absentMembers={absentRaw ?? []}
    />
  );
}

interface UnitMemberApi {
  memberId: string;
  name: string;
  photoUrl: string | null;
  isLead: boolean;
  status: string;
  attended: number;
  total: number;
  rate: number;
}
interface UnitStatsApi {
  id: string;
  name: string;
  totalMembers: number;
  activeMembers: number;
  recentAttendees: number;
  attendanceRate: number;
  leadName: string | null;
}

async function loadUnitLeadDashboard(me: MeResponse) {
  // The backend's /admin/units returns ALL units. We don't yet have a "my unit" endpoint
  // that filters by lead userId — pragmatically: pull the first unit where leadName matches
  // the current user's name. Robust unit-membership lookup is a Week 3 follow-up.
  const [units, nextService] = await Promise.all([
    safeGet<UnitStatsApi[]>("/admin/units"),
    safeGet<{ name: string; scheduledAt: string }>("/attendance/services/next"),
  ]);

  const fullName = me.member ? `${me.member.firstName} ${me.member.lastName}`.trim() : "";
  const myUnit = units?.find((u) => u.leadName === fullName) ?? units?.[0] ?? null;

  if (!myUnit) {
    // UNIT_LEAD without a unit assigned — fall back to MemberHome so they still see content.
    return loadMemberDashboard(me);
  }

  const unitMembers = await safeGet<UnitMemberApi[]>(`/admin/units/${myUnit.id}/attendance?months=3`);
  const atRisk = (unitMembers ?? []).filter((m) => m.rate < 40 && m.status === "ACTIVE").length;

  return (
    <UnitLeadHome
      firstName={me.member?.firstName ?? null}
      unitName={myUnit.name}
      totalMembers={myUnit.totalMembers}
      activeMembers={myUnit.activeMembers}
      attendanceRate={myUnit.attendanceRate}
      membersNeedingAttention={atRisk}
      unitMembers={unitMembers ?? []}
      nextService={nextService}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const me = await safeGet<MeResponse>("/auth/me");

  if (!me) {
    // Authenticated user but /auth/me failed — should be rare. Render the member fallback
    // so the page still loads instead of crashing the boundary.
    return (
      <MemberHome
        userEmail=""
        memberDisplayId="EHC-NEW"
        sermonStreak={0}
        bookmarks={[]}
        listenHistory={[]}
        birthdayDaysUntil={null}
      />
    );
  }

  const role = normalizeRole(me.role);

  if (role === "ADMIN" || role === "PASTOR" || role === "SUPER_ADMIN") {
    return loadAdminDashboard(me);
  }
  if (role === "UNIT_LEAD") {
    return loadUnitLeadDashboard(me);
  }
  // MEMBER or no-role: render personal home
  return loadMemberDashboard(me);
}
