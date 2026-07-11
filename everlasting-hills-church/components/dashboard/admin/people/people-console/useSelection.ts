import { useMemo, useState } from "react";
import type { PersonRow } from "@/lib/api/people";

export function useSelection(rows: PersonRow[]) {
  const [selectedRows, setSelectedRows] = useState<Record<string, PersonRow>>({});
  const selectedIds = useMemo(() => Object.keys(selectedRows), [selectedRows]);
  const allSelected = rows.length > 0 && rows.every((r) => selectedRows[r.id]);

  function toggleRow(id: string) {
    const row = rows.find((r) => r.id === id);
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else if (row) next[id] = row;
      return next;
    });
  }

  function toggleAll() {
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (allSelected) rows.forEach((r) => delete next[r.id]);
      else rows.forEach((r) => (next[r.id] = r));
      return next;
    });
  }

  const clearSelection = () => setSelectedRows({});

  return { selectedRows, selectedIds, allSelected, toggleRow, toggleAll, clearSelection };
}
