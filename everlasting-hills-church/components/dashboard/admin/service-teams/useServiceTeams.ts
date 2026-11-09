import { useMemo, useState } from "react";
import { useDepartments } from "@/lib/api/departments";
import { groupByTeam, useServiceTeamRoster, type ServiceTeamFilters } from "@/lib/api/service-teams";
import { usePagedList } from "@/components/ui/navigation/usePagedList";
import type { RosterView } from "./ViewToggle";

/** Roster, filters, view, paging and the add-to-team dialog state for the Service Teams screen. */
export function useServiceTeams() {
  const [view, setView] = useState<RosterView>("people");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ServiceTeamFilters>({});
  const [addOpen, setAddOpen] = useState(false);
  const [addTo, setAddTo] = useState<{ unitId: string; unitName: string } | null>(null);

  const roster = useServiceTeamRoster({ ...filters, search });
  const { data: departmentsIndex } = useDepartments();
  const data = roster.data;

  const teamsByDepartment = useMemo(() => {
    const teams = data?.teams ?? [];
    return filters.departmentId ? teams.filter((t) => t.departmentId === filters.departmentId) : teams;
  }, [data?.teams, filters.departmentId]);

  // Staffed teams first, biggest first; empty ones last, alphabetically.
  // Sorted here, before paging, so the order holds across pages.
  const grouped = useMemo(
    () =>
      groupByTeam(data).sort((a, b) =>
        a.members.length !== b.members.length ? b.members.length - a.members.length : a.team.name.localeCompare(b.team.name),
      ),
    [data],
  );

  // The roster arrives whole, so paging is over the loaded list. Any change to
  // what is listed — filters, search, or switching view — goes back to page 1.
  const resetKey = JSON.stringify([view, search, filters]);
  const people = usePagedList(data?.people ?? [], { resetKey });
  const teams = usePagedList(grouped, { resetKey });

  function patch(next: Partial<ServiceTeamFilters>) {
    setFilters((prev) => {
      const merged = { ...prev, ...next };
      // Choosing a department invalidates a team picked from another one.
      if (next.departmentId !== undefined && merged.unitId) {
        const stillValid = (data?.teams ?? []).some(
          (t) => t.id === merged.unitId && (!next.departmentId || t.departmentId === next.departmentId),
        );
        if (!stillValid) merged.unitId = "";
      }
      return merged;
    });
  }

  return {
    ...roster,
    view, setView, search, setSearch, filters, patch,
    clearFilters: () => {
      setSearch("");
      setFilters({});
    },
    filtersActive: Boolean(search || filters.departmentId || filters.unitId || filters.role || filters.status),
    departments: departmentsIndex?.departments ?? [],
    teamsByDepartment,
    people,
    teams,
    addOpen,
    addTo,
    openAdd: (unit?: { unitId: string; unitName: string }) => {
      setAddTo(unit ?? null);
      setAddOpen(true);
    },
    closeAdd: () => {
      setAddOpen(false);
      setAddTo(null);
    },
  };
}
