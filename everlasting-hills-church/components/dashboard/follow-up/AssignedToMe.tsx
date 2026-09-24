"use client";

import { UserRoundCheck } from "lucide-react";
import { useMe } from "@/lib/api";
import MasterList from "./MasterList";
import type { MasterListQuery } from "@/lib/api/follow-up-pipeline";

/**
 * The people you are responsible for reaching — the same table as the Master
 * list, pinned to you, so opening someone gives the identical details and
 * conversation rather than a second, thinner view of the same person.
 */
export default function AssignedToMe({ scope = "FOLLOW_UP" }: { scope?: MasterListQuery["scope"] }) {
  const { data: me } = useMe();
  const memberId = me?.member?.id ?? "";

  if (!memberId) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.04]">
        <p className="text-sm font-semibold text-[#111] dark:text-white">No member record</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/45">
          Your account isn&apos;t linked to a member yet, so nothing can be assigned to you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/45">
        <UserRoundCheck size={15} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
        Everyone currently assigned to you. Open anyone to log a call or hand them on.
      </p>

      <MasterList fixed={{ assigneeId: memberId, scope }} showFilters={false} />
    </div>
  );
}
