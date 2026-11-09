"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { AttendanceRow } from "@/lib/api/attendance-roll";
import RollRow from "./RollRow";
import type { RollSortCol } from "./roll-query";

const th = "px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white/50 whitespace-nowrap";

/** The roll itself. With one service picked the service column is dropped, since every row shares it. */
export default function RollTable({ rows, loading, oneService, sort, onSort, selected, onToggle, onToggleAll, overridingId, onOverride }: {
  rows: AttendanceRow[];
  loading: boolean;
  oneService: boolean;
  sort: { col: RollSortCol; dir: "asc" | "desc" } | null;
  onSort: (col: RollSortCol) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  overridingId: string | null;
  onOverride: (row: AttendanceRow) => void;
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const columns = oneService ? 4 : 5;

  function SortHead({ col, label, className = "" }: { col: RollSortCol; label: string; className?: string }) {
    const active = sort?.col === col;
    return (
      <th scope="col" className={`${th} ${className}`} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
        <button type="button" onClick={() => onSort(col)} className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white">
          {label}
          {active && (sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </button>
      </th>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50/70 dark:bg-white/[0.02]">
        <tr>
          <th scope="col" className="w-10 py-3 pl-5">
            <input type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Select everyone on this page" className="rounded accent-[#87102C]" />
          </th>
          <SortHead col="name" label="Member" />
          {!oneService && <SortHead col="date" label="Service" className="hidden sm:table-cell" />}
          <SortHead col="markedBy" label="How" className="hidden md:table-cell" />
          <SortHead col="status" label="Status" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-white/[0.08]">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="py-3 pl-5"><div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700" /></td>
              <td className="px-4 py-3" colSpan={columns}><div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-700" /></td>
            </tr>
          ))
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={columns} className="px-5 py-12 text-center text-sm text-gray-500 dark:text-white/50">
              Nobody matches these filters. Try another service or clear the filters.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <RollRow
              key={row.id}
              row={row}
              oneService={oneService}
              selected={selected.has(row.id)}
              onToggle={() => onToggle(row.id)}
              saving={overridingId === row.id}
              onOverride={() => onOverride(row)}
            />
          ))
        )}
      </tbody>
    </table>
  );
}
