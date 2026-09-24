"use client";

import { FileBarChart, ListChecks, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFollowUpLeadership } from "./useFollowUpLeadership";

export type FollowUpTab = "master" | "mine" | "report";

export interface TabDef {
  id: FollowUpTab;
  label: string;
  icon: LucideIcon;
}

const ALL_TABS: TabDef[] = [
  { id: "master", label: "Master list", icon: ListChecks },
  { id: "mine", label: "Assigned to me", icon: UserCheck },
  { id: "report", label: "Report", icon: FileBarChart },
];

/**
 * Which tabs a person gets.
 *
 * Master list and Assigned to me are for everyone on the team. Report is the
 * Follow Up unit's own write-up, so it goes to its lead — or the head of
 * department over it. Leading some other team does not qualify.
 */
export function useFollowUpTabs(): TabDef[] {
  const { canRunUnit } = useFollowUpLeadership();

  return ALL_TABS.filter((tab) => (tab.id === "report" ? canRunUnit : true));
}
