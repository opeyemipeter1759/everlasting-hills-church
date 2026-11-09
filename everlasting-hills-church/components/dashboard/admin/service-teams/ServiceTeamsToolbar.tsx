import { Download, Loader2, RefreshCw, Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import { serviceTeamCsv, type ServiceTeamFilters, type ServiceTeamRoster, type ServiceTeamSummary, type TeamRole } from "@/lib/api/service-teams";
import ViewToggle, { type RosterView } from "./ViewToggle";

function downloadCsv(data: ServiceTeamRoster) {
  const blob = new Blob([serviceTeamCsv(data)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `service-teams-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** View toggle, search, department/team/role filters, refresh and CSV export. */
export default function ServiceTeamsToolbar({ view, onView, search, onSearch, filters, onPatch, departments, teams, data, isFetching, onRefresh }: {
  view: RosterView;
  onView: (v: RosterView) => void;
  search: string;
  onSearch: (v: string) => void;
  filters: ServiceTeamFilters;
  onPatch: (next: Partial<ServiceTeamFilters>) => void;
  departments: { id: string; name: string }[];
  /** Teams offered in the team filter — already narrowed to the chosen department. */
  teams: ServiceTeamSummary[];
  data: ServiceTeamRoster | undefined;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ViewToggle view={view} onChange={onView} />

      <div className="relative min-w-[180px] flex-1">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search name, email or phone"
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#87102C]/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:placeholder:text-white/25"
        />
      </div>

      <Select
        aria-label="Department"
        value={filters.departmentId ?? ""}
        onChange={(v) => onPatch({ departmentId: v })}
        options={[{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
      />
      <Select
        aria-label="Team"
        value={filters.unitId ?? ""}
        onChange={(v) => onPatch({ unitId: v })}
        options={[{ value: "", label: "All teams" }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
      />
      <Select
        aria-label="Role on team"
        value={filters.role ?? ""}
        onChange={(v) => onPatch({ role: v as TeamRole | "" })}
        options={[
          { value: "", label: "Any role" },
          { value: "LEAD", label: "Leads" },
          { value: "ASSISTANT", label: "Assistants" },
          { value: "MEMBER", label: "Members" },
        ]}
      />

      <button
        type="button"
        onClick={onRefresh}
        disabled={isFetching}
        aria-label="Refresh"
        className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:text-[#87102C] disabled:opacity-50 dark:border-white/10 dark:text-white/50"
      >
        {isFetching ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
      </button>
      <button
        type="button"
        onClick={() => data && downloadCsv(data)}
        disabled={!data || data.people.length === 0}
        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:text-[#87102C] disabled:opacity-40 dark:border-white/10 dark:text-white/55"
      >
        <Download size={14} /> Export
      </button>
    </div>
  );
}
