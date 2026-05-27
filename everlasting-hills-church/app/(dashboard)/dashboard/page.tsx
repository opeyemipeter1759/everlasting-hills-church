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

  /**
   * Pass explicit zero/null/empty values for sections whose backend (Attendance, Services,
   * Prayer-count-by-member) isn't wired yet. This activates MemberHome's "No records yet"
   * empty-state branches instead of falling through to its bundled dummy data — honest UI
   * over misleading-but-pretty placeholder numbers.
   *
   * When the Attendance + Services modules ship richer endpoints, swap the zeros for real
   * calls; the prop shape doesn't need to change.
   */
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
      // Real
      sermonStreak={sermonStreak}
      bookmarks={bookmarks}
      listenHistory={listenHistory}
      birthdayDaysUntil={birthdayDaysUntil}
      // Honest empty/zero values until Attendance + Services modules ship richer endpoints
      attendanceRate={0}
      attendanceCount={0}
      streakWeeks={0}
      lastServiceDate={null}
      nextService={null}
      hasCheckedInToday={false}
      todayService={null}
      prayerCount={0}
      recentServices={[]}
      monthlyAttendance={[]}
    />
  );
}

interface VisitorRowApi {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  attendanceType: string | null;
  membershipInterest: string | null;
  howDidYouLearn: string | null;
  locatedInIbadan: boolean | null;
  bornAgain: string | null;
  occupation: string | null;
  submittedAt: string;
}

async function loadAdminDashboard(me: MeResponse) {
  // Parallel fetches across analytics + members + attendance + visitors.
  const [analytics, attendanceStats, members, birthdaysRaw, absentRaw, visitors] =
    await Promise.all([
      safeGet<AdminAnalytics>("/admin/analytics"),
      safeGet<AttendanceStats>("/attendance/stats"),
      safeGet<MemberRowApi[]>("/members?status=ACTIVE"),
      safeGet<BirthdayRowApi[]>("/members/birthdays/upcoming?daysAhead=7"),
      safeGet<AbsentRowApi[]>("/members/absent?missedSundays=3"),
      safeGet<VisitorRowApi[]>("/visitors?limit=10"),
    ]);

  // Convert ISO strings to Date objects to match the AdminOverview prop contract.
  const recentMembers = (members ?? []).slice(0, 10).map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    phone: m.phone,
    joinedAt: new Date(m.joinedAt),
  }));

  const recentVisitors = (visitors ?? []).map((v) => ({
    id: v.id,
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email,
    phone: v.phone,
    gender: v.gender,
    attendanceType: v.attendanceType,
    membershipInterest: v.membershipInterest,
    howDidYouLearn: v.howDidYouLearn,
    locatedInIbadan: v.locatedInIbadan,
    bornAgain: v.bornAgain,
    occupation: v.occupation,
    submittedAt: new Date(v.submittedAt),
  }));

  return (
    <AdminOverview
      userName={me.member?.firstName ?? null}
      stats={{
        members: analytics?.totalMembers ?? 0,
        visitors: analytics?.totalVisitors ?? 0,
        todayCheckIns: attendanceStats?.todayCheckIns ?? 0,
        prayers: analytics?.totalPrayers ?? 0,
      }}
      recentVisitors={recentVisitors}
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
interface MyUnit {
  id: string;
  name: string;
  description: string | null;
  totalMembers: number;
  isLead: boolean;
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
  // Identity-based lookup via /units/me — joins Profile → Member → UnitMember(isLead=true).
  // Robust to name changes and works even when two leads share a name.
  const [myUnit, nextService] = await Promise.all([
    safeGet<MyUnit | null>("/units/me"),
    safeGet<{ name: string; scheduledAt: string }>("/attendance/services/next"),
  ]);

  if (!myUnit) {
    // UNIT_LEAD without an assignment — fall back to MemberHome so they still see content.
    return loadMemberDashboard(me);
  }

  // Pull this unit's rich stats + member attendance from the analytics module
  const [unitStats, unitMembers] = await Promise.all([
    safeGet<UnitStatsApi[]>(`/admin/units?unitId=${myUnit.id}`),
    safeGet<UnitMemberApi[]>(`/admin/units/${myUnit.id}/attendance?months=3`),
  ]);

  const stats = unitStats?.[0];
  const atRisk = (unitMembers ?? []).filter((m) => m.rate < 40 && m.status === "ACTIVE").length;

  return (
    <UnitLeadHome
      firstName={me.member?.firstName ?? null}
      unitName={myUnit.name}
      totalMembers={stats?.totalMembers ?? myUnit.totalMembers}
      activeMembers={stats?.activeMembers ?? 0}
      attendanceRate={stats?.attendanceRate ?? 0}
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
