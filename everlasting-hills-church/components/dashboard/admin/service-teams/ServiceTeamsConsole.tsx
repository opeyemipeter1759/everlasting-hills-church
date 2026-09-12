"use client";

import { useMemo, useState } from "react";
import { Download, LayoutGrid, Loader2, RefreshCw, Search, UserPlus, Users } from "lucide-react";
import { Select } from "@/components/ui/select";
import { useDepartments } from "@/lib/api/departments";
import {
  groupByTeam,
  serviceTeamCsv,
  useServiceTeamRoster,
  type ServiceTeamFilters,
  type TeamRole,
} from "@/lib/api/service-teams";
import StatsStrip from "./StatsStrip";
import PeopleView from "./PeopleView";
import TeamsView from "./TeamsView";
import AddToTeamDialog from "./AddToTeamDialog";

/**
 * Service teams: who serves, and where.
 *
 * The Units screen is organised by team, so a person on three teams appears
 * three times and nothing tells you it is one person. This reads the same rows
 * person-first, and keeps the by-team view as a second lens on the identical
 * payload rather than a second query that could disagree with the first.
 */
export default function ServiceTeamsConsole() {
  const [view, setView] = useState<"people" | "teams">("people");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ServiceTeamFilters>({});
  const [addOpen, setAddOpen] = useState(false);
  const [addTo, setAddTo] = useState<{ unitId: string; unitName: string } | null>(null);

  const { data, isLoading, isFetching, refetch } = useServiceTeamRoster({ ...filters, search });
  const { data: departmentsIndex } = useDepartments();

  const teamsByDepartment = useMemo(() => {
    const teams = data?.teams ?? [];
    if (!filters.departmentId) return teams;
    return teams.filter((t) => t.departmentId === filters.departmentId);
  }, [data?.teams, filters.departmentId]);

  const grouped = useMemo(() => groupByTeam(data), [data]);

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

  function exportCsv() {
    if (!data) return;
    const blob = new Blob([serviceTeamCsv(data)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `service-teams-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openAdd(unit?: { unitId: string; unitName: string }) {
    setAddTo(unit ?? null);
    setAddOpen(true);
  }

  const filtersActive = Boolean(
    search || filters.departmentId || filters.unitId || filters.role || filters.status,
  );

  return (
    <div className="space-y-6 px-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">
            Service teams
          </h1>
          <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/45">
            Everyone serving in the church, and the team they serve on. A person on two teams is
            one row here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAdd()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]"
        >
          <UserPlus size={15} /> Add to a team
        </button>
      </header>

      <StatsStrip stats={data?.stats} loading={isLoading} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
          {(
            [
              { key: "people", label: "By person", icon: Users },
              { key: "teams", label: "By team", icon: LayoutGrid },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setView(tab.key)}
                aria-pressed={view === tab.key}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  view === tab.key
                    ? "bg-[#87102C] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 dark:text-white/45 dark:hover:text-white"
                }`}
              >
                <Icon size={13} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[180px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#87102C]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:placeholder:text-white/25"
          />
        </div>

        <Select
          aria-label="Department"
          value={filters.departmentId ?? ""}
          onChange={(v) => patch({ departmentId: v })}
          options={[
            { value: "", label: "All departments" },
            ...(departmentsIndex?.departments ?? []).map((d) => ({ value: d.id, label: d.name })),
          ]}
        />

        <Select
          aria-label="Team"
          value={filters.unitId ?? ""}
          onChange={(v) => patch({ unitId: v })}
          options={[
            { value: "", label: "All teams" },
            ...teamsByDepartment.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />

        <Select
          aria-label="Role on team"
          value={filters.role ?? ""}
          onChange={(v) => patch({ role: v as TeamRole | "" })}
          options={[
            { value: "", label: "Any role" },
            { value: "LEAD", label: "Leads" },
            { value: "ASSISTANT", label: "Assistants" },
            { value: "MEMBER", label: "Members" },
          ]}
        />

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh"
          className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:text-[#87102C] disabled:opacity-50 dark:border-white/10 dark:text-white/50"
        >
          {isFetching ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
        </button>

        <button
          type="button"
          onClick={exportCsv}
          disabled={!data || data.people.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:text-[#87102C] disabled:opacity-40 dark:border-white/10 dark:text-white/55"
        >
          <Download size={14} /> Export
        </button>
      </div>

      {filtersActive && data && (
        <p className="-mt-2 text-xs text-[#8a7e80] dark:text-white/40">
          {data.stats.matched} {data.stats.matched === 1 ? "person" : "people"} match.{" "}
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilters({});
            }}
            className="font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
          >
            Clear filters
          </button>
        </p>
      )}

      {view === "people" ? (
        <PeopleView
          people={data?.people ?? []}
          loading={isLoading}
          filtered={filtersActive}
          onAdd={() => openAdd()}
        />
      ) : (
        <TeamsView groups={grouped} loading={isLoading} onAddTo={openAdd} />
      )}

      <AddToTeamDialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddTo(null);
        }}
        teams={data?.teams ?? []}
        fixedTeam={addTo}
      />
    </div>
  );
}
