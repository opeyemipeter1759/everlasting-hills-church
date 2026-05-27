import UnitLeadHome from "@/components/dashboard/UnitLeadHome";
import { safeGet, type MeResponse } from "./shared";
import { loadMemberDashboard } from "./member-loader";

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

/**
 * Unit-lead dashboard.
 *
 * Identity-based lookup via /units/me (Profile → Member → UnitMember(isLead=true)) — no
 * fragile name-matching. If the user is UNIT_LEAD but unassigned to a unit, we fall back
 * to the member dashboard so they still see useful content.
 */
export async function loadUnitLeadDashboard(me: MeResponse) {
  const [myUnit, nextService] = await Promise.all([
    safeGet<MyUnit | null>("/units/me"),
    safeGet<{ name: string; scheduledAt: string }>("/attendance/services/next"),
  ]);

  if (!myUnit) {
    return loadMemberDashboard(me);
  }

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
