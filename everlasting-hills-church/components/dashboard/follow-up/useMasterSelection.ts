"use client";

import { useCallback, useMemo, useState } from "react";
import type { MasterListRow } from "@/lib/api/follow-up-pipeline";

export function rowKey(row: MasterListRow): string {
  return `${row.kind}-${row.id}`;
}

/**
 * Who a leader has ticked. People are held whole rather than by id, because
 * changing a status records what it changed *from*, and because a selection
 * survives paging — tick a few here, a few on the next page, set them together.
 */
export function useMasterSelection() {
  const [picked, setPicked] = useState<Record<string, MasterListRow>>({});
  const people = useMemo(() => Object.values(picked), [picked]);

  const toggle = useCallback((row: MasterListRow) => {
    setPicked((current) => {
      const key = rowKey(row);
      if (!current[key]) return { ...current, [key]: row };
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  /** The header box: tick every row on this page, or clear them all. */
  const toggleAll = useCallback((rows: MasterListRow[], select: boolean) => {
    setPicked((current) => {
      const next = { ...current };
      for (const row of rows) {
        if (select) next[rowKey(row)] = row;
        else delete next[rowKey(row)];
      }
      return next;
    });
  }, []);

  return {
    people,
    count: people.length,
    has: (row: MasterListRow) => !!picked[rowKey(row)],
    toggle,
    toggleAll,
    clear: useCallback(() => setPicked({}), []),
  };
}
