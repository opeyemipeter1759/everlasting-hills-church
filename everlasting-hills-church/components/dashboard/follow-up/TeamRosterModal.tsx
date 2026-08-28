"use client";

import { AlertTriangle, Crown, Repeat, UsersRound } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { EmptyState } from "@/components/ui/display/EmptyState";
import { useFollowUpTeam } from "@/lib/api/follow-up-pipeline";
import type { FollowUpEntry } from "@/types/follow-up";
import { PersonAvatar } from "./PersonAvatar";

interface TeamRosterModalProps {
  open: boolean;
  onClose: () => void;
  unitId: string;
  unitName?: string;
  /** Already-loaded church-wide entries — reused to compute each member's
   * workload instead of a separate request. */
  entries: FollowUpEntry[];
  viewerId: string;
  isLeader: boolean;
  onBulkReassign: () => void;
}

export function TeamRosterModal({ open, onClose, unitId, unitName, entries, viewerId, isLeader, onBulkReassign }: TeamRosterModalProps) {
  const { data: team = [], isLoading } = useFollowUpTeam(unitId);

  const withLoad = team.map((member) => {
    const assigned = entries.filter(
      (e) => e.assignee?.id === member.id && e.stage !== "CONFIRMED" && e.memberStatus !== "OPTED_OUT",
    );
    const overdue = assigned.filter((e) => e.dueStatus === "OVERDUE").length;
    return { ...member, openCount: assigned.length, overdue };
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={unitName ? `${unitName} Team` : "Team"}
      description="Everyone on this team, and how many open follow-ups they're carrying right now."
    >
      <div className="space-y-4">
        {isLeader && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onBulkReassign();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-dashed border-[#87102C]/30 dark:border-[#FFB3C1]/25 text-[#87102C] dark:text-[#FFB3C1] hover:bg-[#FFF4F6] dark:hover:bg-white/5 transition-colors"
          >
            <Repeat size={12} aria-hidden="true" />
            Bulk reassign entries
          </button>
        )}

        {isLoading ? (
          <ul className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 py-2">
                <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        ) : withLoad.length === 0 ? (
          <EmptyState icon={UsersRound} title="No one on this team yet" description="Ask an admin to add members to this unit." compact />
        ) : (
          <ul className="divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.07] -mx-1">
            {withLoad.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-1 py-2.5">
                <PersonAvatar person={member} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-[#111] dark:text-white truncate">
                      {member.id === viewerId ? "You" : member.name}
                    </p>
                    {member.isLead && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1]">
                        <Crown size={8} aria-hidden="true" />
                        Lead
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8a7e80] dark:text-white/40 mt-0.5">
                    {member.openCount} open follow-up{member.openCount === 1 ? "" : "s"}
                  </p>
                </div>
                {member.overdue > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex-shrink-0">
                    <AlertTriangle size={9} aria-hidden="true" />
                    {member.overdue} overdue
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
