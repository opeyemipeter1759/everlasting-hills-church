"use client";

import { useState } from "react";
import Link from "next/link";
import { useApprovals, useDecideApproval, type Approval } from "@/lib/api/classes";
import { showToast } from "@/components/ui/toast/toast";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { ClassError, ClassLoading, errorText, formatDate } from "../shared";

type Status = "PENDING" | "CONFIRMED" | "DECLINED";

/** "Ready for membership": people who finished the Membership Class, for a Pastor or Admin to confirm. */
export default function ApprovalsTab() {
  const [status, setStatus] = useState<Status>("PENDING");
  const { data, isLoading, error, refetch } = useApprovals(status);
  const decide = useDecideApproval();
  const [deciding, setDeciding] = useState<{ approval: Approval; confirm: boolean } | null>(null);
  const [note, setNote] = useState("");

  async function submit() {
    if (!deciding) return;
    try {
      await decide.mutateAsync({ id: deciding.approval.id, confirm: deciding.confirm, note: note.trim() || undefined });
      const name = `${deciding.approval.Member.firstName} ${deciding.approval.Member.lastName}`;
      showToast.success(deciding.confirm ? `${name} is now a full member` : `Noted. ${name} stays in training for now.`);
      setDeciding(null);
      setNote("");
    } catch (err) {
      showToast.error(errorText(err));
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        {(["PENDING", "CONFIRMED", "DECLINED"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`cls-chip ${status === s ? "!bg-[var(--color-burgundy)] !text-white" : ""}`}
          >
            {s === "PENDING" ? "Waiting" : s === "CONFIRMED" ? "Confirmed" : "Declined"}
          </button>
        ))}
      </div>

      {isLoading && <ClassLoading />}
      {error && <div className="mt-4"><ClassError error={error} onRetry={() => refetch()} /></div>}
      {data && data.length === 0 && (
        <p className="mt-6 text-black/60 dark:text-white/60">
          {status === "PENDING" ? "No one is waiting. People appear here when they finish the Membership Class." : "Nothing here yet."}
        </p>
      )}
      {data && data.length > 0 && (
        <ul className="mt-4 space-y-3">
          {data.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-[16px] border border-[var(--color-pink-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.04]">
              <span>
                <Link href={`/dashboard/admin/members/${a.Member.id}`} className="block font-semibold text-[var(--color-ink)] hover:underline dark:text-white">
                  {a.Member.firstName} {a.Member.lastName}
                </Link>
                <span className="block text-sm text-black/60 dark:text-white/60">
                  Finished {a.Course.title} {formatDate(a.createdAt)}
                  {a.decidedAt ? ` · decided ${formatDate(a.decidedAt)}` : ""}
                  {a.note ? ` · "${a.note}"` : ""}
                </span>
              </span>
              {a.status === "PENDING" && (
                <span className="flex gap-2">
                  <button type="button" onClick={() => setDeciding({ approval: a, confirm: false })} className="cls-btn cls-btn-outline !px-4 !py-2">
                    Not yet
                  </button>
                  <button type="button" onClick={() => setDeciding({ approval: a, confirm: true })} className="cls-btn cls-btn-primary !px-4 !py-2">
                    Confirm membership
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deciding}
        tone={deciding?.confirm ? "info" : "warning"}
        title={deciding?.confirm ? "Confirm full membership?" : "Keep them in training for now?"}
        description={
          deciding && (
            <div className="space-y-3">
              <p>
                {deciding.confirm
                  ? `${deciding.approval.Member.firstName} ${deciding.approval.Member.lastName} becomes a full member of the church. They will be told, and their certificate will say so.`
                  : `${deciding.approval.Member.firstName} stays a member in training. Tell them why, or what to do next.`}
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={deciding.confirm ? "A word for the record (optional)" : "What should they do next? (sent to them)"}
                className="w-full rounded-[12px] border border-gray-200 p-2 text-sm text-gray-900 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
              />
            </div>
          )
        }
        confirmLabel={deciding?.confirm ? "Confirm membership" : "Keep in training"}
        loading={decide.isPending}
        onConfirm={submit}
        onCancel={() => {
          setDeciding(null);
          setNote("");
        }}
      />
    </div>
  );
}
