"use client";

import { useMyDepartmentUnits, useMyUnits } from "@/lib/api";
import { isIntegrationUnit } from "@/lib/integration-unit";
import { useFollowUpLeadership } from "./useFollowUpLeadership";

/**
 * The Integration Team's unit, and whether you may assign its people: its own
 * lead or assistant, a head of department over it, or church-wide staff —
 * the same people the API lets make an Integration Team assignment. Leading
 * Follow Up doesn't count; that is the other team.
 */
export function useIntegrationTeam(): { unitId: string | null; canAssign: boolean } {
  const { data: departments = [] } = useMyDepartmentUnits();
  const { data: mine = [] } = useMyUnits();
  const { isHod, churchWide } = useFollowUpLeadership();

  const unit = departments.flatMap((d) => d.units).find((u) => isIntegrationUnit(u.name)) ?? null;
  const leadsIt = mine.some((u) => isIntegrationUnit(u.name) && (u.isLead || u.isAssistant));
  return { unitId: unit?.id ?? null, canAssign: leadsIt || isHod || churchWide };
}
