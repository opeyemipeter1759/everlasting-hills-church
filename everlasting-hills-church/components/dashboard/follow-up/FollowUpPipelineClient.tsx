"use client";

import { useMemo, useState } from "react";
import { Plus, Search, ShieldAlert, Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hasMinRole } from "@/lib/auth/frontend-session";
import { useMe, useMyUnit } from "@/lib/api";
import { useFollowUpEntries } from "@/lib/api/follow-up-pipeline";
import type { ApiError } from "@/lib/api/axios";
import type { FollowUpEntry, FollowUpSourceType } from "@/types/follow-up";
import { PipelineStats } from "./PipelineStats";
import { MasterListTable } from "./MasterListTable";
import { FollowUpDetailDrawer } from "./FollowUpDetailDrawer";
import { AddToMasterListModal } from "./AddToMasterListModal";
import { AssignFollowUpModal } from "./AssignFollowUpModal";
import { PersonAvatar } from "./PersonAvatar";
import FollowUpPipelineSkeleton from "@/components/ui/skeleton/FollowUpPipelineSkeleton";
import { Select } from "@/components/ui/select";

type StageTab = "all" | "unassigned" | "in_progress" | "archive";
type SourceFilter = "all" | FollowUpSourceType;

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

export default function FollowUpPipelineClient() {
  const currentUser = useCurrentUser();
  const { data: me } = useMe();
  const { data: myUnit } = useMyUnit();
  const { data: entries = [], isLoading, error } = useFollowUpEntries();
  const accessDenied = (error as ApiError | null)?.status === 403;

  const [activeTab, setActiveTab] = useState<StageTab>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [myAssignedOnly, setMyAssignedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<FollowUpEntry | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const isLeader = hasMinRole(currentUser?.role, "UNIT_LEAD");
  const viewerId = me?.member?.id ?? "";
  const viewer = me?.member
    ? { id: me.member.id, name: `${me.member.firstName ?? ""} ${me.member.lastName ?? ""}`.trim(), photoUrl: me.member.photoUrl }
    : null;

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const isOptedOut = e.memberStatus === "OPTED_OUT";
      // Follow-up is continuous — nothing gets archived away for being "done". The
      // only thing that leaves the active views is an opted-out member, and Archive
      // is the only place they show up.
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

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;

  if (isLoading) return <FollowUpPipelineSkeleton />;

  if (accessDenied) {
    return (
      <div className="max-w-6xl">
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
    <div className="space-y-5 max-w-6xl">
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

        {isLeader && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors flex-shrink-0"
          >
            <Plus size={15} aria-hidden="true" />
            Add to Master List
          </button>
        )}
      </div>

      {/* Stats — church-wide, same numbers for every viewer */}
      <PipelineStats entries={entries} />

      {/* Tabs + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

        <div className="flex items-center gap-2 flex-shrink-0">
          <Select
            aria-label="Filter by source"
            value={sourceFilter}
            onChange={(v) => setSourceFilter(v as SourceFilter)}
            className="px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-[#87102C]/25 cursor-pointer"
            options={SOURCE_FILTERS.map((f) => ({ value: f.id, label: f.label }))}
          />

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

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone…"
              className="pl-8 pr-3 py-2 rounded-lg text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#87102C]/25 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Master list */}
      <MasterListTable
        entries={filtered}
        viewerId={viewerId}
        onSelect={(entry) => setSelectedEntryId(entry.id)}
        onAssign={(entry) => setAssignTarget(entry)}
      />

      <FollowUpDetailDrawer
        entry={selectedEntry}
        viewerId={viewerId}
        onClose={() => setSelectedEntryId(null)}
        onAssign={(entry) => setAssignTarget(entry)}
      />

      <AssignFollowUpModal entry={assignTarget} onClose={() => setAssignTarget(null)} />

      <AddToMasterListModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
}
