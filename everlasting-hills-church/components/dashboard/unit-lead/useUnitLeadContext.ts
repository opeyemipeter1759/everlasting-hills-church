import { useMyUnits, useMyUnitDetail, useAddUnitMember, useRemoveUnitMember } from "@/lib/api";

/**
 * Context for a single unit-lead page, scoped to one unitId (a lead can lead
 * more than one unit — see AppSidebar's dynamicUnits expansion). `summary`
 * comes from the lightweight /units/mine list (has isLead/isAssistant for the
 * current user); `unit` comes from the self-scoped /units/mine/:unitId detail
 * (full member list).
 */
export function useUnitLeadContext(unitId: string) {
  const { data: units, isLoading: unitsLoading, refetch: refetchUnits, isFetching: unitsFetching } = useMyUnits();
  const { data: unit, refetch: refetchUnit, isFetching: unitFetching } = useMyUnitDetail(unitId);
  const addMemberMut = useAddUnitMember();
  const removeMemberMut = useRemoveUnitMember();

  const summary = unitsLoading ? undefined : units?.find((u) => u.id === unitId) ?? null;

  async function addMember(memberId: string, isLead: boolean) {
    await addMemberMut.mutateAsync({ unitId, memberId, isLead });
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member from the unit?")) return;
    await removeMemberMut.mutateAsync({ unitId, memberId });
  }

  function refresh() {
    refetchUnits();
    refetchUnit();
  }

  return {
    summary,
    unit: unit ?? null,
    addMember,
    removeMember,
    refresh,
    isRefreshing: unitsFetching || unitFetching,
  };
}
