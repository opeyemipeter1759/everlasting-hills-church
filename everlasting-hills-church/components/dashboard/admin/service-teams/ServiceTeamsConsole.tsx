"use client";

import { UserPlus } from "lucide-react";
import { PaginationFooter } from "@/components/ui/navigation/PaginationFooter";
import StatsStrip from "./StatsStrip";
import PeopleView from "./PeopleView";
import TeamsView from "./TeamsView";
import AddToTeamDialog from "./AddToTeamDialog";
import ServiceTeamsToolbar from "./ServiceTeamsToolbar";
import { useServiceTeams } from "./useServiceTeams";

export default function ServiceTeamsConsole() {
  const st = useServiceTeams();
  const { data, isLoading } = st;

  return (
    <div className="space-y-6 px-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Service teams</h1>
          <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/45">
            Everyone serving in the church, and the team they serve on. A person on two teams is
            one row here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => st.openAdd()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]"
        >
          <UserPlus size={15} /> Add to a team
        </button>
      </header>

      <StatsStrip stats={data?.stats} loading={isLoading} />

      <ServiceTeamsToolbar
        view={st.view}
        onView={st.setView}
        search={st.search}
        onSearch={st.setSearch}
        filters={st.filters}
        onPatch={st.patch}
        departments={st.departments}
        teams={st.teamsByDepartment}
        data={data}
        isFetching={st.isFetching}
        onRefresh={() => st.refetch()}
      />

      {st.filtersActive && data && (
        <p className="-mt-2 text-xs text-[#8a7e80] dark:text-white/40">
          {data.stats.matched} {data.stats.matched === 1 ? "person" : "people"} match.{" "}
          <button type="button" onClick={st.clearFilters} className="font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
            Clear filters
          </button>
        </p>
      )}

      {st.view === "people" ? (
        <>
          <PeopleView people={st.people.items} loading={isLoading} filtered={st.filtersActive} onAdd={() => st.openAdd()} />
          {!isLoading && <PaginationFooter paged={st.people} noun="people" />}
        </>
      ) : (
        <>
          <TeamsView groups={st.teams.items} loading={isLoading} onAddTo={st.openAdd} />
          {!isLoading && <PaginationFooter paged={st.teams} noun="teams" />}
        </>
      )}

      <AddToTeamDialog open={st.addOpen} onClose={st.closeAdd} teams={data?.teams ?? []} fixedTeam={st.addTo} />
    </div>
  );
}
