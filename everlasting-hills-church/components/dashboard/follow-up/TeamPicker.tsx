"use client";

import { Check } from "lucide-react";
import type { PersonRef } from "@/types/follow-up";
import { RowAvatar } from "./table-bits";

/** Your unit's members, to hand a person's follow-up to one of them. */
export function TeamPicker({
  team,
  assignedToId,
  busy,
  onPick,
}: {
  team: (PersonRef & { isLead: boolean })[];
  assignedToId: string | null;
  busy: boolean;
  onPick: (memberId: string) => void;
}) {
  return (
    <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-white/[0.06] dark:border-white/10">
      {team.map((member) => {
        const current = member.id === assignedToId;
        return (
          <li key={member.id}>
            <button
              type="button"
              disabled={busy || current}
              onClick={() => onPick(member.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#FFF7F9] disabled:cursor-default dark:hover:bg-white/[0.04]"
            >
              <RowAvatar name={member.name} photoUrl={member.photoUrl} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#111] dark:text-white">
                {member.name}
                {member.isLead && <span className="ml-1.5 text-xs text-gray-400">· lead</span>}
              </span>
              {current && <Check size={15} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
