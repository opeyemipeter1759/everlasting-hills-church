"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Home, List, MapPin, Phone, ShieldOff, UserPlus } from "lucide-react";
import type { FollowUpEntry } from "@/types/follow-up";
import { EmptyState } from "@/components/ui/display/EmptyState";
import { timeAgo } from "@/lib/utils/time";
import { PersonAvatar } from "./PersonAvatar";
import { DueStatusPill, OutcomePill, RiskCategoryPill, SourceTypePill, StagePill } from "./StagePill";

interface MasterListTableProps {
  entries: FollowUpEntry[];
  viewerId: string;
  onSelect: (entry: FollowUpEntry) => void;
  onAssign: (entry: FollowUpEntry) => void;
}

type ViewMode = "list" | "area";

function ContactDots({ count, goal }: { count: number; goal: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${count} of ${goal} contacts logged`}>
      {Array.from({ length: goal }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < count ? "bg-[#87102C] dark:bg-[#FFB3C1]" : "bg-[#E7CDD3]/60 dark:bg-white/15"}`}
        />
      ))}
    </div>
  );
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase());
}

/** First comma-segment of the address, title-cased — good enough to cluster a home-visit
 * trip without needing real geocoding. Entries with no address fall into "Unknown area". */
function areaOf(entry: FollowUpEntry): string {
  const addr = entry.personDetail?.address;
  if (!addr) return "Unknown area";
  const seg = addr.split(",")[0]?.trim();
  return seg ? titleCase(seg) : "Unknown area";
}

function EntryRow({
  entry, viewerId, onSelect, onAssign,
}: { entry: FollowUpEntry; viewerId: string; onSelect: (e: FollowUpEntry) => void; onAssign: (e: FollowUpEntry) => void }) {
  const isMine = entry.assignee?.id === viewerId;
  const isOptedOut = entry.memberStatus === "OPTED_OUT";
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className={`w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03] transition-colors ${isOptedOut ? "opacity-70" : ""}`}
    >
      <PersonAvatar person={entry.person} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-[#111] dark:text-white truncate">{entry.person.name}</p>
          <SourceTypePill type={entry.sourceType} />
          <DueStatusPill status={entry.dueStatus} />
          {entry.absenteeDetail?.category && <RiskCategoryPill category={entry.absenteeDetail.category} />}
          {isOptedOut && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20">
              <ShieldOff size={9} aria-hidden="true" /> Opted Out
            </span>
          )}
          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/40 border-gray-200 dark:border-white/[0.09]">
            {entry.unitName}
          </span>
        </div>
        {entry.absenteeDetail && entry.absenteeDetail.missedServices.length > 0 ? (
          <p className="text-xs text-[#8a7e80] dark:text-white/40 mt-0.5">
            Missed {entry.absenteeDetail.missedServices.length} recent service
            {entry.absenteeDetail.missedServices.length === 1 ? "" : "s"}
          </p>
        ) : (
          entry.person.phone && (
            <p className="text-xs text-[#8a7e80] dark:text-white/40 mt-0.5 flex items-center gap-1">
              <Phone size={10} aria-hidden="true" />
              {entry.person.phone}
            </p>
          )
        )}
      </div>

      {/* Assignee */}
      <div className="hidden sm:flex items-center gap-2 w-40 flex-shrink-0">
        {entry.assignee ? (
          <>
            <PersonAvatar person={entry.assignee} size="sm" />
            <span className="text-xs font-medium text-[#111] dark:text-white/80 truncate">
              {isMine ? "You" : entry.assignee.name}
            </span>
          </>
        ) : entry.viewerCanApprove ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssign(entry);
            }}
            className="text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:underline flex items-center gap-1"
          >
            <UserPlus size={12} aria-hidden="true" />
            Assign
          </button>
        ) : (
          <span className="text-xs text-[#8a7e80] dark:text-white/35">Unassigned</span>
        )}
      </div>

      {/* Stage — once an outcome's been logged, that's more useful to scan
          than the generic "Confirmed" stage label */}
      <div className="hidden md:block w-28 flex-shrink-0">
        {entry.outcome ? <OutcomePill outcome={entry.outcome} /> : <StagePill stage={entry.stage} />}
      </div>

      {/* Progress */}
      <div className="hidden lg:flex items-center gap-2 w-24 flex-shrink-0">
        <ContactDots count={entry.contactCount} goal={entry.goalContacts} />
        <span className="text-[10px] text-[#8a7e80] dark:text-white/35 tabular-nums">
          {entry.contactCount}/{entry.goalContacts}
        </span>
      </div>

      {/* Last contact */}
      <div className="hidden sm:block w-20 flex-shrink-0 text-right">
        <span className="text-[11px] text-[#8a7e80] dark:text-white/35">
          {entry.lastContactAt ? timeAgo(entry.lastContactAt) : "—"}
        </span>
      </div>

      <ChevronRight size={15} className="text-[#b8a8ac] dark:text-white/25 flex-shrink-0" aria-hidden="true" />
    </button>
  );
}

type ListRow =
  | { type: "single"; entry: FollowUpEntry }
  | { type: "household"; householdId: string; entries: FollowUpEntry[] };

/** Groups *consecutive* rows sharing a non-null householdId into one stacked family
 * card. Only adjacent rows are grouped — this reflects display order, not a full
 * re-sort, so it stays predictable alongside whatever sort/filter produced `entries`. */
function buildHouseholdRows(entries: FollowUpEntry[]): ListRow[] {
  const rows: ListRow[] = [];
  let i = 0;
  while (i < entries.length) {
    const e = entries[i];
    const hid = e.personDetail?.householdId ?? null;
    if (hid) {
      const group = [e];
      let j = i + 1;
      while (j < entries.length && entries[j].personDetail?.householdId === hid) {
        group.push(entries[j]);
        j++;
      }
      if (group.length > 1) {
        rows.push({ type: "household", householdId: hid, entries: group });
        i = j;
        continue;
      }
    }
    rows.push({ type: "single", entry: e });
    i++;
  }
  return rows;
}

export function MasterListTable({ entries, viewerId, onSelect, onAssign }: MasterListTableProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [collapsedAreas, setCollapsedAreas] = useState<Record<string, boolean>>({});

  const householdRows = useMemo(() => buildHouseholdRows(entries), [entries]);

  const areaGroups = useMemo(() => {
    const map = new Map<string, FollowUpEntry[]>();
    for (const e of entries) {
      const key = areaOf(e);
      const list = map.get(key);
      if (list) list.push(e);
      else map.set(key, [e]);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] === "Unknown area" ? 1 : b[0] === "Unknown area" ? -1 : a[0].localeCompare(b[0])))
      .map(([area, items]) => ({ area, items }));
  }, [entries]);

  function toggleArea(area: string) {
    setCollapsedAreas((prev) => ({ ...prev, [area]: !prev[area] }));
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl">
        <EmptyState
          icon={UserPlus}
          title="Nothing here"
          description="No one matches this view right now."
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none">
      <div className="flex items-center justify-end px-4 py-2 border-b border-[#E7CDD3]/30 dark:border-white/[0.06]">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 p-0.5" role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
              view === "list" ? "bg-[#87102C] text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <List size={12} aria-hidden="true" />
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "area"}
            onClick={() => setView("area")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
              view === "area" ? "bg-[#87102C] text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <MapPin size={12} aria-hidden="true" />
            By Area
          </button>
        </div>
      </div>

      {view === "list" ? (
        <ul className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
          {householdRows.map((row) =>
            row.type === "single" ? (
              <li key={row.entry.id} className={row.entry.memberStatus === "OPTED_OUT" ? "border-l-2 border-rose-400 dark:border-rose-500/50" : ""}>
                <EntryRow entry={row.entry} viewerId={viewerId} onSelect={onSelect} onAssign={onAssign} />
              </li>
            ) : (
              <li key={row.householdId} className="bg-gray-50/60 dark:bg-white/[0.02]">
                <div className="flex items-center gap-1.5 px-6 pt-2.5 pb-1">
                  <Home size={11} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#87102C] dark:text-[#FFB3C1]">
                    Household · {row.entries.length} members
                  </span>
                </div>
                <ul className="divide-y divide-[#E7CDD3]/20 dark:divide-white/[0.05]">
                  {row.entries.map((entry) => (
                    <li key={entry.id} className="pl-3 border-l-2 border-[#87102C]/20 dark:border-[#FFB3C1]/15 ml-3">
                      <EntryRow entry={entry} viewerId={viewerId} onSelect={onSelect} onAssign={onAssign} />
                    </li>
                  ))}
                </ul>
              </li>
            ),
          )}
        </ul>
      ) : (
        <div className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
          {areaGroups.map(({ area, items }) => {
            const collapsed = !!collapsedAreas[area];
            return (
              <div key={area}>
                <button
                  type="button"
                  onClick={() => toggleArea(area)}
                  className="w-full flex items-center justify-between gap-2 px-6 py-3 bg-gray-50/70 dark:bg-white/[0.02] hover:bg-gray-100/70 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
                    <span className="text-xs font-bold text-[#111] dark:text-white">{area}</span>
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.09] text-gray-500 dark:text-white/40">
                      {items.length}
                    </span>
                  </span>
                  {collapsed ? (
                    <ChevronRight size={14} className="text-gray-400" aria-hidden="true" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" aria-hidden="true" />
                  )}
                </button>
                {!collapsed && (
                  <ul className="divide-y divide-[#E7CDD3]/20 dark:divide-white/[0.05]">
                    {items.map((entry) => (
                      <li key={entry.id}>
                        <EntryRow entry={entry} viewerId={viewerId} onSelect={onSelect} onAssign={onAssign} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
