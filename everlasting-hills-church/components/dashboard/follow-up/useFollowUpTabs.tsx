"use client";

import { CalendarRange, FileBarChart, ListChecks, UserCheck, UserX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFollowUpLeadership } from "./useFollowUpLeadership";

export type FollowUpTab = "master" | "overview" | "mine" | "optedOut" | "report";

export interface TabDef {
  id: FollowUpTab;
  label: string;
  icon: LucideIcon;
}

const ALL_TABS: TabDef[] = [
  { id: "master", label: "Master list", icon: ListChecks },
  { id: "overview", label: "Overview", icon: CalendarRange },
  { id: "mine", label: "Assigned to me", icon: UserCheck },
  { id: "optedOut", label: "Opted out", icon: UserX },
  { id: "report", label: "Report", icon: FileBarChart },
];

/**
 * Which tabs a person gets.
 *
 * A member of the team sees only Assigned to me: the people given to them.
 * The Master list, Overview, Opted out and the Report are for whoever runs the
 * Follow Up unit: its lead, the head of department over it, or anyone
 * church-wide. Leading some other team does not qualify.
 */
export function useFollowUpTabs(): TabDef[] {
  const { canRunUnit } = useFollowUpLeadership();

  return ALL_TABS.filter((tab) => tab.id === "mine" || canRunUnit);
}
