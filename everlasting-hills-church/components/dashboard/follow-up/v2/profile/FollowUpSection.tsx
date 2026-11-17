"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, UserX } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { useArchiveFirstTimer, useFollowUpActions, useStageAction } from "@/lib/api/follow-up-stage";
import { AssigneeCard } from "../../AssigneeCard";
import { stageLabel } from "../status";
import type { ProfileSectionProps } from "./types";

type Confirm = "opt-out" | "restore" | "archive" | null;

const BUTTON = "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-colors disabled:opacity-50";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

/**
 * Where their follow-up stands and who has them, with the one manual move
 * left: opt out, or restore. Visits and approvals set everything else. Admins
 * can archive a record that should not be on the list at all.
 */
export default function FollowUpSection({ profile, refresh }: ProfileSectionProps) {
  const { person } = profile;
  const router = useRouter();
  const { data: can } = useFollowUpActions(person.visitorId);
  const optOut = useStageAction(person.visitorId, "opt-out");
  const restore = useStageAction(person.visitorId, "restore");
  const archive = useArchiveFirstTimer();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const busy = optOut.isPending || restore.isPending || archive.isPending;
  const name = person.firstName;

  async function run() {
    if (confirm === "archive") {
      const archived = await archive.mutateAsync(person.visitorId).then(() => true, () => false);
      // Archived, the profile is gone, so go back to the list.
      if (archived) router.push("/dashboard/follow-up/overview");
      else setConfirm(null);
      return;
    }
    const mutation = confirm === "opt-out" ? optOut : restore;
    await mutation.mutateAsync().catch(() => null);
    setConfirm(null);
    refresh();
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]" aria-label="Follow-up">
      <h2 className="text-sm font-semibold text-[#111] dark:text-white">Follow-up</h2>
      <dl className="mt-3 space-y-2.5 text-sm">
        <div className="flex items-center gap-3">
          <dt className="w-24 flex-shrink-0 font-medium text-gray-500 dark:text-white/45">Stage</dt>
          <dd className="font-semibold text-[#111] dark:text-white">{stageLabel(person.stage)}</dd>
        </div>
        <div className="flex items-center gap-3">
          <dt className="w-24 flex-shrink-0 font-medium text-gray-500 dark:text-white/45">First contact</dt>
          <dd className="text-gray-700 dark:text-white/75">{when(person.firstContactedAt) ?? "Not logged yet"}</dd>
        </div>
      </dl>
      <div className="mt-2.5">
        <AssigneeCard
          assignedTo={person.assigneeId ? { id: person.assigneeId, name: person.assigneeName ?? "Someone" } : null}
          entryId={person.entryId}
          canReassign={!!can?.canReassign}
          unitId={person.unitId ?? undefined}
        />
        {person.unitName && <p className="ml-24 mt-1 text-xs text-gray-500 dark:text-white/45">Under {person.unitName}</p>}
      </div>

      {(can?.canOptOut || can?.canRestore || can?.canArchive || can?.restoreBlockedBy) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
          {can?.canOptOut && (
            <button type="button" disabled={busy} onClick={() => setConfirm("opt-out")} className={`${BUTTON} border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10`}>
              <UserX size={15} aria-hidden="true" /> Opt out
            </button>
          )}
          {can?.canRestore && (
            <button type="button" disabled={busy} onClick={() => setConfirm("restore")} className={`${BUTTON} border-[#87102C] bg-[#87102C] text-white hover:bg-[#6E0C24]`}>
              <RotateCcw size={15} aria-hidden="true" /> Restore
            </button>
          )}
          {can?.canArchive && (
            <button type="button" disabled={busy} onClick={() => setConfirm("archive")} className={`${BUTTON} ml-auto border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10`}>
              <Archive size={15} aria-hidden="true" /> Archive
            </button>
          )}
          {can?.restoreBlockedBy && <p className="w-full text-xs text-gray-500 dark:text-white/45">{can.restoreBlockedBy}</p>}
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        tone={confirm === "archive" ? "danger" : confirm === "opt-out" ? "warning" : "info"}
        title={confirm === "archive" ? `Archive ${name}?` : confirm === "opt-out" ? `Opt ${name} out?` : `Restore ${name}?`}
        description={
          confirm === "archive"
            ? `${name} will drop out of every list and count. Nothing is deleted: the record, the team's notes and the history stay, and the archive is logged.`
            : confirm === "opt-out"
              ? `Nobody will follow ${name} up, and they will count as opted out. You can restore them later.`
              : `${name} goes back to the stage they had before they were opted out.`
        }
        confirmLabel={confirm === "archive" ? "Archive" : confirm === "opt-out" ? "Opt out" : "Restore"}
        loading={busy}
        onConfirm={run}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}
