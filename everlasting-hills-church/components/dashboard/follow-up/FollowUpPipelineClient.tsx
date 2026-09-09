"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Clock3, ListChecks, RefreshCw, Search, ShieldAlert, Trophy, Users, UsersRound } from "lucide-react";
import { hasMinRole } from "@/lib/auth/frontend-session";
import { useMe } from "@/lib/api";
import {
  useBackfillFollowUpService,
  useFollowUpAccess,
  useFollowUpEntries,
  useFollowUpReportsUnit,
  useFollowUpServices,
  useMyFollowUpUnit,
} from "@/lib/api/follow-up-pipeline";
import type { ApiError } from "@/lib/api/axios";
import type { FollowUpEntry, FollowUpSourceType } from "@/types/follow-up";
import { PipelineStats } from "./PipelineStats";
import { MasterListTable } from "./MasterListTable";
import { FollowUpDetailDrawer } from "./FollowUpDetailDrawer";
import { AssignFollowUpModal } from "./AssignFollowUpModal";
import { BulkReassignModal } from "./BulkReassignModal";
import { TeamRosterModal } from "./TeamRosterModal";
import { TodayView } from "./TodayView";
import { WinsLeaderboardPanel } from "./WinsLeaderboardPanel";
import { ServiceReportPanel } from "./ServiceReportPanel";
import { PersonAvatar } from "./PersonAvatar";
import FollowUpPipelineSkeleton from "@/components/ui/skeleton/FollowUpPipelineSkeleton";
import { Pagination } from "@/components/ui/navigation/Pagination";
import { Select } from "@/components/ui/select";
import { FadeIn } from "@/components/ui/motion/FadeIn";

type MainView = "master" | "today" | "wins" | "reports";
type StageTab = "all" | "unassigned" | "in_progress" | "archive";
type SourceFilter = "all" | FollowUpSourceType;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

const STAGE_TABS: { id: StageTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unassigned", label: "Unassigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "archive", label: "Archive" },
];

const SOURCE_FILTERS: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "All Types" },
  { id: "FIRST_TIMER", label: "First-Timers" },
  { id: "ABSENTEE", label: "Absentees" },
];

function formatServiceOption(s: { name: string; scheduledAt: string; serviceType: string }): string {
  const date = new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return `${date} — ${s.name}`;
}

export default function FollowUpPipelineClient() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: myUnit } = useMyFollowUpUnit();
  const { data: reportsUnit } = useFollowUpReportsUnit();
  const { data: services = [] } = useFollowUpServices();

  const isLeader = hasMinRole(me?.role, "UNIT_LEAD");

  const [mainView, setMainView] = useState<MainView>("master");
  const [activeTab, setActiveTabState] = useState<StageTab>("all");
  const [sourceFilter, setSourceFilterState] = useState<SourceFilter>("all");
  const [myAssignedOnly, setMyAssignedOnlyState] = useState(false);
  const [search, setSearchState] = useState("");
  const [serviceId, setServiceIdState] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<FollowUpEntry | null>(null);
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false);
  const [teamRosterOpen, setTeamRosterOpen] = useState(false);

  // There's no "all service days" view — activity is logged per service, so the
  // page always has one concrete service in scope. Defaults to the most recent
  // one that's already happened; the picker just moves between past services.
  useEffect(() => {
    if (!serviceId && services.length > 0) setServiceIdState(services[0].id);
  }, [serviceId, services]);

  const { data: entries = [], isLoading, isFetching, error } = useFollowUpEntries({ serviceId: serviceId || undefined });
  // The server decides. Being in a unit is not the same as being on a
  // follow-up team, and the entries query can answer 200 for someone who should
  // not be reading pastoral notes about named people — so the dedicated access
  // check is the gate, with a 403 from the list as a backstop.
  const access = useFollowUpAccess();
  const accessDenied =
    access.data?.hasAccess === false || (error as ApiError | null)?.status === 403;
  const backfillService = useBackfillFollowUpService();

  // Any change to what's being filtered resets back to page 1 — otherwise a
  // narrower result set can leave the view stranded on a page past the end.
  const setActiveTab = (v: StageTab) => { setActiveTabState(v); setPage(1); };
  const setSourceFilter = (v: SourceFilter) => { setSourceFilterState(v); setPage(1); };
  const setMyAssignedOnly = (v: boolean | ((prev: boolean) => boolean)) => {
    setMyAssignedOnlyState(v);
    setPage(1);
  };
  const setSearch = (v: string) => { setSearchState(v); setPage(1); };
  const setServiceId = (v: string) => { setServiceIdState(v); setPage(1); };
  const setPageSize = (v: number) => { setPageSizeState(v); setPage(1); };

  const viewerId = me?.member?.id ?? "";
  const viewer = me?.member
    ? { id: me.member.id, name: `${me.member.firstName ?? ""} ${me.member.lastName ?? ""}`.trim(), photoUrl: me.member.photoUrl }
    : null;

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const isOptedOut = e.memberStatus === "OPTED_OUT";

      if (activeTab === "archive") {
        if (!isOptedOut) return false;
      } else if (isOptedOut) {
        return false;
      } else {
        if (activeTab === "unassigned" && e.stage !== "UNASSIGNED") return false;
        if (activeTab === "in_progress" && e.stage === "UNASSIGNED") return false;
      }

      if (sourceFilter !== "all" && e.sourceType !== sourceFilter) return false;
      if (myAssignedOnly && e.assignee?.id !== viewerId) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matches = e.person.name.toLowerCase().includes(q) || e.person.phone?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [entries, activeTab, sourceFilter, myAssignedOnly, search, viewerId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Clamp back if a mutation or filter change shrinks the result set below the
  // page we were sitting on (e.g. an entry gets opted out while viewing page 3).
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;

  const MAIN_VIEWS: { id: MainView; label: string; icon: typeof ListChecks }[] = [
    { id: "master", label: "Master List", icon: ListChecks },
    { id: "today", label: "Today", icon: Clock3 },
    { id: "wins", label: "Wins & Leaderboard", icon: Trophy },
    ...(reportsUnit ? [{ id: "reports" as const, label: "Service Report", icon: ClipboardCheck }] : []),
  ];

  if (isLoading || access.isPending) return <FollowUpPipelineSkeleton />;

  if (accessDenied) {
    return (
      <div className="px-5">
        <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl flex flex-col items-center justify-center text-center py-16 px-6">
          <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center mb-4">
            <ShieldAlert size={18} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-[#111] dark:text-white">Not part of a team yet</p>
          <p className="text-xs text-[#8a7e80] dark:text-white/40 mt-1 max-w-xs">
            The Follow-Up Pipeline is only visible to members serving on a unit. Ask your unit leader or admin to add you to a team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#111] dark:text-white">Follow-Up Pipeline</h1>
            {myUnit && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#FFB3C1] bg-[#FFE8ED] dark:bg-[#87102C]/25 px-2 py-1 rounded-full">
                <Users size={10} aria-hidden="true" />
                {myUnit.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Track every first-timer and returning member from first contact to confirmed follow-up.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["follow-up"] })}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-[#87102C] dark:text-[#FFB3C1] border border-[#87102C]/30 dark:border-[#FFB3C1]/25 hover:bg-[#FFF4F6] dark:hover:bg-white/5 transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats — church-wide, same numbers for every viewer */}
      <PipelineStats entries={entries} />

      {/* Top-level view nav */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#E7CDD3]/40 dark:border-white/[0.07]">
        {MAIN_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setMainView(v.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              mainView === v.id
                ? "text-[#87102C] dark:text-[#FFB3C1] border-[#87102C] dark:border-[#FFB3C1]"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <v.icon size={13} aria-hidden="true" />
            {v.label}
          </button>
        ))}
      </div>

      {mainView === "master" && (
        <FadeIn key="master" duration={0.25}>
          <div className="space-y-5">
            {/* Tabs + filters — each row wraps freely rather than being forced onto
                one line, so a phone-width screen just stacks controls instead of
                squeezing or overflowing them. */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {STAGE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "bg-[#87102C] text-white"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label="Filter by service day"
                  value={serviceId}
                  onChange={setServiceId}
                  className="text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#87102C]/25 cursor-pointer w-full sm:w-56 sm:flex-shrink-0"
                  options={services.map((s) => ({ value: s.id, label: formatServiceOption(s) }))}
                />

                <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 p-0.5" role="tablist" aria-label="Filter by source">
                  {SOURCE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={sourceFilter === f.id}
                      onClick={() => setSourceFilter(f.id)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
                        sourceFilter === f.id
                          ? "bg-[#87102C] text-white"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setMyAssignedOnly((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    myAssignedOnly
                      ? "border-[#87102C]/40 bg-[#87102C]/10 text-[#87102C] dark:text-[#FFB3C1]"
                      : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {viewer && <PersonAvatar person={viewer} size="sm" />}
                  My Assigned
                </button>

                {myUnit && (
                  <button
                    type="button"
                    onClick={() => setTeamRosterOpen(true)}
                    title="See everyone on your team and their current workload"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <UsersRound size={13} aria-hidden="true" />
                    Team
                  </button>
                )}
              </div>

              {/* Search sits on its own line — it's the one filter someone reaches
                  for anytime, so it always gets full room instead of fighting the
                  others for space or overflowing. */}
              <div className="relative w-full sm:w-72">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or phone…"
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#87102C]/25"
                />
              </div>
            </div>

            {/* Master list */}
            {serviceId && filtered.length === 0 && isLeader ? (
              <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl flex flex-col items-center justify-center text-center py-14 px-6">
                <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center mb-4">
                  <RefreshCw size={18} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                </div>
                <p className="text-sm font-bold text-[#111] dark:text-white">Nothing on the Master List for this service yet</p>
                <p className="text-xs text-[#8a7e80] dark:text-white/40 mt-1 max-w-sm">
                  {services.find((s) => s.id === serviceId)
                    ? `${formatServiceOption(services.find((s) => s.id === serviceId)!)} may fall outside the daily sweep's window. `
                    : ""}
                  Generate entries for this day — anyone absent, or still-unconverted first-timers from it.
                </p>
                <button
                  type="button"
                  onClick={() => backfillService.mutate(serviceId)}
                  disabled={backfillService.isPending}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  {backfillService.isPending ? "Generating…" : "Generate for this service"}
                </button>
              </div>
            ) : (
              <MasterListTable
                entries={paged}
                viewerId={viewerId}
                serviceId={serviceId || undefined}
                onSelect={(entry) => setSelectedEntryId(entry.id)}
                onAssign={(entry) => setAssignTarget(entry)}
              />
            )}

            {filtered.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-[11px] text-[#8a7e80] dark:text-white/35 order-2 sm:order-1">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-3 order-1 sm:order-2">
                  <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
                  <Select
                    aria-label="Rows per page"
                    value={String(pageSize)}
                    onChange={(v) => setPageSize(Number(v))}
                    className="text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#87102C]/25 cursor-pointer"
                    options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))}
                  />
                </div>
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {mainView === "today" && (
        <FadeIn key="today" duration={0.25}>
          <TodayView onSelect={(entry) => setSelectedEntryId(entry.id)} />
        </FadeIn>
      )}

      {mainView === "wins" && (
        <FadeIn key="wins" duration={0.25}>
          <WinsLeaderboardPanel />
        </FadeIn>
      )}

      {mainView === "reports" && reportsUnit && (
        <FadeIn key="reports" duration={0.25}>
          <ServiceReportPanel unitId={reportsUnit.id} unitName={reportsUnit.name} />
        </FadeIn>
      )}

      <FollowUpDetailDrawer
        entry={selectedEntry}
        viewerId={viewerId}
        defaultServiceId={serviceId || undefined}
        onClose={() => setSelectedEntryId(null)}
        onAssign={(entry) => setAssignTarget(entry)}
      />

      <AssignFollowUpModal entry={assignTarget} onClose={() => setAssignTarget(null)} />

      {myUnit && (
        <>
          <TeamRosterModal
            open={teamRosterOpen}
            onClose={() => setTeamRosterOpen(false)}
            unitId={myUnit.id}
            unitName={myUnit.name}
            entries={entries}
            viewerId={viewerId}
            isLeader={isLeader}
            onBulkReassign={() => setBulkReassignOpen(true)}
          />
          <BulkReassignModal
            open={bulkReassignOpen}
            onClose={() => setBulkReassignOpen(false)}
            unitId={myUnit.id}
            unitName={myUnit.name}
          />
        </>
      )}
    </div>
  );
}
