"use client";

import { ChevronRight, Phone, UserPlus } from "lucide-react";
import type { FollowUpEntry } from "@/types/follow-up";
import { EmptyState } from "@/components/ui/display/EmptyState";
import { timeAgo } from "@/lib/utils/time";
import { PersonAvatar } from "./PersonAvatar";
import { RiskCategoryPill, SourceTypePill, StagePill } from "./StagePill";

interface MasterListTableProps {
  entries: FollowUpEntry[];
  viewerId: string;
  onSelect: (entry: FollowUpEntry) => void;
  onAssign: (entry: FollowUpEntry) => void;
}

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

export function MasterListTable({ entries, viewerId, onSelect, onAssign }: MasterListTableProps) {
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
      <ul className="divide-y divide-[#E7CDD3]/30 dark:divide-white/[0.06]">
        {entries.map((entry) => {
          const isMine = entry.assignee?.id === viewerId;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <PersonAvatar person={entry.person} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-[#111] dark:text-white truncate">{entry.person.name}</p>
                    <SourceTypePill type={entry.sourceType} />
                    {entry.absenteeDetail?.category && <RiskCategoryPill category={entry.absenteeDetail.category} />}
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

                {/* Stage */}
                <div className="hidden md:block w-28 flex-shrink-0">
                  <StagePill stage={entry.stage} />
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
