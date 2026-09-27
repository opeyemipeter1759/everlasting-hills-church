"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { useMe, useMyDepartmentUnits } from "@/lib/api";
import { isFollowUpUnit } from "@/lib/integration-unit";
import type { MasterListRow } from "@/lib/api/follow-up-pipeline";
import type { VisitorRow } from "@/components/dashboard/admin/FirstTimer/types";

/**
 * Editing a first-timer from the Master list.
 *
 * The row carries only a name, so the full record is fetched when the pencil
 * is pressed and handed to the same modal the First Timers page uses — one
 * edit form for first-timers, wherever you open it from.
 *
 * Only two people get the Edit button here: the lead of the Follow Up unit,
 * and the Admin Head over the department Follow Up belongs to. Leading some
 * other unit, heading some other department, or a church-wide role is not
 * enough; those people can still correct a first-timer from the First Timers
 * page.
 */
export function useMasterListEditing() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: departments = [] } = useMyDepartmentUnits();
  const [editing, setEditing] = useState<MasterListRow | null>(null);

  const canEdit = canEditFollowUp(me, departments);

  const { data: visitor } = useQuery({
    queryKey: ["visitors", editing?.id],
    queryFn: () => api.get<VisitorRow>(`/visitors/${editing?.id}`),
    enabled: !!editing && editing.kind === "VISITOR",
  });

  return {
    canEdit,
    editing,
    /** Null until the record has loaded, which is what keeps the modal closed. */
    visitor: editing && visitor?.id === editing.id ? visitor : null,
    open: (row: MasterListRow) => setEditing(row),
    close: () => setEditing(null),
    saved: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["follow-up", "master-list"] });
    },
  };
}

/**
 * The Follow Up unit's lead, or the Admin Head of its department — nobody else.
 * Found by name, since admins type unit names ("Follow-Up", "Follow up team").
 */
export function canEditFollowUp(
  me: { unitLeadOf?: string[]; hodOf?: string[] } | undefined,
  departments: { department: { id: string }; units: { id: string; name: string }[] }[],
): boolean {
  if (!me) return false;
  const home = departments.find((d) => d.units.some((u) => isFollowUpUnit(u.name)));
  const followUp = home?.units.find((u) => isFollowUpUnit(u.name));
  if (!home || !followUp) return false;
  return (me.unitLeadOf ?? []).includes(followUp.id) || (me.hodOf ?? []).includes(home.department.id);
}
