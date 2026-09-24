"use client";

import { useState } from "react";
import {
  useDecideStatusChange,
  usePendingStatusChanges,
  type MasterListRow,
  type PendingStatusChange,
} from "@/lib/api/follow-up-pipeline";
import { PersonDrawer } from "./PersonDrawer";
import { PendingRow } from "./PendingRow";

/**
 * Status changes the team has asked for, waiting on a unit lead or head of
 * department. Each one says who asked and what they want changed, and opens the
 * person's full details so the decision isn't made on a name alone.
 */
export default function PendingApprovals() {
  const { data: pending = [], isLoading } = usePendingStatusChanges(true);
  const decide = useDecideStatusChange();
  const [opened, setOpened] = useState<MasterListRow | null>(null);

  /** Enough of the person for the drawer to open on; it fetches the rest. */
  function asPerson(request: PendingStatusChange): MasterListRow {
    return {
      id: request.subjectId,
      kind: request.subjectKind === "VISITOR" ? "VISITOR" : "MEMBER",
      name: request.name,
      photoUrl: null,
      assignedTo: null,
      status: request.fromStatus,
      statusAwaitingApproval: request.toStatus,
      hasAccount: request.subjectKind !== "VISITOR",
      attended: 0,
    };
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.06]" />
        ))}
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.04]">
        <p className="text-sm font-semibold text-[#111] dark:text-white">Nothing waiting</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/45">
          When someone asks to change a person&apos;s status, it will appear here for you to approve.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pending.map((request) => (
        <PendingRow
          key={request.id}
          request={request}
          busy={decide.isPending}
          onOpen={() => setOpened(asPerson(request))}
          onDecide={(approve) => decide.mutate({ id: request.id, approve })}
        />
      ))}

      <PersonDrawer person={opened} onClose={() => setOpened(null)} />
    </div>
  );
}
