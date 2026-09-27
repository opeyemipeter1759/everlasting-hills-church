"use client";

import { FileBarChart, ListChecks, UserCheck, UserX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFollowUpLeadership } from "./useFollowUpLeadership";

export type FollowUpTab = "master" | "mine" | "optedOut" | "report";

export interface TabDef {
  id: FollowUpTab;
  label: string;
  icon: LucideIcon;
}

const ALL_TABS: TabDef[] = [
  { id: "master", label: "Master list", icon: ListChecks },
  { id: "mine", label: "Assigned to me", icon: UserCheck },
  { id: "optedOut", label: "Opted out", icon: UserX },
  { id: "report", label: "Report", icon: FileBarChart },
];

/**
 * Which tabs a person gets.
 *
 * Master list, Assigned to me and Opted out are for everyone on the team —
 * someone who opts out leaves the first two and waits on the third. Report is the
 * Follow Up unit's own write-up, so it goes to its lead — or the head of
 * department over it. Leading some other team does not qualify.
 */
export function useFollowUpTabs(): TabDef[] {
  const { canRunUnit } = useFollowUpLeadership();

  return ALL_TABS.filter((tab) => (tab.id === "report" ? canRunUnit : true));
}
