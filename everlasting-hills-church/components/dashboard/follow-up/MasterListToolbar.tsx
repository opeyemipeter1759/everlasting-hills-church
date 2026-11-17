"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMe } from "@/lib/api";
import { useFollowUpTeam } from "@/lib/api/follow-up-pipeline";
import { usePipelineYear } from "@/lib/api/pipeline";
import { Select } from "@/components/ui/select";
import { FilterSearch } from "./FilterSearch";
import { PILL } from "./filter-bits";
import { MonthYearFilter } from "./v2/MonthYearFilter";

/** Search as you type, sent to the API a moment after the typing stops. */
export function useDebounced(value: string, ms = 300): string {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

/**
 * The filters above a pipeline list: search by name or phone, who has them,
 * and the month and year of their first visit (kept in the address, so a
 * filtered list can be shared). `children` adds page-specific filters.
 */
export function MasterListToolbar({
  search,
  onSearch,
  assigneeId,
  onAssignee,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  /** Leave out to hide the assignee filter, e.g. on Assigned to me. */
  assigneeId?: string;
  onAssignee?: (value: string) => void;
  children?: ReactNode;
}) {
  const { data: me } = useMe();
  const { data: team = [] } = useFollowUpTeam();
  const thisYear = new Date().getFullYear();
  const { data: year } = usePipelineYear(thisYear);
  const myId = me?.member?.id ?? null;

  const options = [
    { value: "", label: "Anyone" },
    ...(myId ? [{ value: myId, label: "Assigned to me" }] : []),
    { value: "none", label: "Nobody assigned" },
    ...team.filter((m) => m.id !== myId).map((m) => ({ value: m.id, label: m.name })),
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <FilterSearch value={search} onChange={onSearch} />
      {onAssignee && (
        <Select
          aria-label="Assigned to"
          value={assigneeId ?? ""}
          onChange={onAssignee}
          className={`${PILL} w-full sm:w-[13rem]`}
          options={options}
        />
      )}
      <MonthYearFilter firstYear={year?.firstYear} />
      {children}
    </div>
  );
}
