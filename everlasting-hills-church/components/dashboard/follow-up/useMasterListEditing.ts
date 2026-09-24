"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { useMe } from "@/lib/api";
import type { MasterListRow } from "@/lib/api/follow-up-pipeline";
import type { VisitorRow } from "@/components/dashboard/admin/FirstTimer/types";

const CHURCH_WIDE_ROLES = ["ADMIN", "ADMIN_HEAD", "PASTOR", "SUPER_ADMIN"];

/**
 * Editing a first-timer from the Master list.
 *
 * The row carries only a name, so the full record is fetched when the pencil
 * is pressed and handed to the same modal the First Timers page uses — one
 * edit form for first-timers, wherever you open it from. The button is shown
 * only to roles the API will actually accept a change from, rather than
 * offering an edit that comes back refused.
 */
export function useMasterListEditing() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [editing, setEditing] = useState<MasterListRow | null>(null);

  // Whoever the API will accept a correction from: a unit lead or head of
  // department doing follow-up work, and anyone church-wide.
  const canEdit =
    (me?.effectiveRoles ?? []).some((role) => CHURCH_WIDE_ROLES.includes(role)) ||
    (me?.unitLeadOf ?? []).length > 0 ||
    (me?.hodOf ?? []).length > 0;

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
