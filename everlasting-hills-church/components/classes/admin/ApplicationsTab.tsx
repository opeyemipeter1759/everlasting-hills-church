"use client";

import { useState } from "react";
import Link from "next/link";
import { useApplications, useDecideApplication, type Application } from "@/lib/api/classes";
import { showToast } from "@/components/ui/toast/toast";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { ClassError, ClassLoading, errorText, formatDate } from "../shared";

type Filter = "PENDING" | "APPROVED" | "DECLINED";
const ATTENDING_LABEL: Record<string, string> = {
  under_1_month: "less than a month",
  "1_to_3_months": "1 to 3 months",
  "3_to_12_months": "3 to 12 months",
  over_1_year: "more than a year",
};
const LABEL: Record<Filter, string> = { PENDING: "Waiting", APPROVED: "Approved", DECLINED: "Declined" };

/**
 * Applications to join a class. A Super Admin, Pastor or Admin Head approves or
 * declines each one; the member is told either way. A note on a decline is sent
 * to the member, so it should say what to do next.
 */
export default function ApplicationsTab() {
  const [filter, setFilter] = useState<Filter>("PENDING");
  const { data, isLoading, error, refetch } = useApplications(filter);
  const decide = useDecideApplication();
  const [deciding, setDeciding] = useState<{ application: Application; approve: boolean } | null>(null);
  const [note, setNote] = useState("");

  async function submit() {
    if (!deciding) return;
    const { application, approve } = deciding;
    try {
      await decide.mutateAsync({ id: application.id, approve, note: note.trim() || undefined });
      const name = `${application.Member.firstName} ${application.Member.lastName}`;
      showToast.success(approve ? `${name} is approved for ${application.Course.title}` : `${name} was told their application was not approved`);
      setDeciding(null);
      setNote("");
    } catch (err) {
      showToast.error(errorText(err));
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        {(["PENDING", "APPROVED", "DECLINED"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`cls-chip ${filter === f ? "!bg-[var(--color-burgundy)] !text-white" : ""}`}
          >
            {LABEL[f]}
          </button>
        ))}
      </div>

      {isLoading && <ClassLoading />}
      {error && <div className="mt-4"><ClassError error={error} onRetry={() => refetch()} /></div>}
      {data && data.length === 0 && (
        <p className="mt-6 text-black/60 dark:text-white/60">
          {filter === "PENDING" ? "No applications are waiting. They appear here when a member applies to join a class." : "Nothing here yet."}
        </p>
      )}
      {data && data.length > 0 && (
        <ul className="mt-4 space-y-3">
          {data.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 rounded-[16px] border border-[var(--color-pink-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.04]"
            >
              <span>
                <Link href={`/dashboard/admin/members/${a.Member.id}`} className="block font-semibold text-[var(--color-ink)] hover:underline dark:text-white">
                  {a.Member.firstName} {a.Member.lastName}
                </Link>
                <span className="block text-sm text-black/60 dark:text-white/60">
                  {filter === "PENDING" ? "Applied" : "Decided"} for {a.Course.title} on {formatDate(filter === "PENDING" ? a.enrolledAt : a.decidedAt ?? a.enrolledAt)}
                  {a.decisionNote ? `: "${a.decisionNote}"` : ""}
                </span>
                {a.applicationAnswers && (
                  <span className="mt-3 block space-y-1 rounded-[12px] bg-[var(--color-blush)] p-3 text-sm text-black/75 dark:bg-white/[0.06] dark:text-white/75">
                    <span className="block">&ldquo;{a.applicationAnswers.reason}&rdquo;</span>
                    <span className="block text-black/55 dark:text-white/55">
                      Worshipping with us: {ATTENDING_LABEL[a.applicationAnswers.attendingFor] ?? a.applicationAnswers.attendingFor}. Given their life to Jesus:{" "}
                      {a.applicationAnswers.bornAgain === "yes" ? "yes" : "not sure yet"}.
                      {a.applicationAnswers.homeCell ? ` Home Cell: ${a.applicationAnswers.homeCell}.` : ""}
                    </span>
                    {a.applicationAnswers.notes && <span className="block text-black/55 dark:text-white/55">Notes: {a.applicationAnswers.notes}</span>}
                  </span>
                )}
                <span className="mt-1 block text-sm text-black/60 dark:text-white/60">
                  {a.eligibility.required > 0
                    ? `${a.eligibility.attended} of ${a.eligibility.required} Sundays attended${a.eligibility.eligible ? "" : `, ${a.eligibility.remaining} to go`}`
                    : "No attendance requirement"}
                </span>
              </span>
              {a.status === "PENDING" && (
                <span className="flex gap-2">
                  <button type="button" onClick={() => setDeciding({ application: a, approve: false })} className="cls-btn cls-btn-outline !px-4 !py-2">
                    Decline
                  </button>
                  <button type="button" onClick={() => setDeciding({ application: a, approve: true })} className="cls-btn cls-btn-primary !px-4 !py-2">
                    Approve
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deciding}
        tone={deciding?.approve ? "info" : "warning"}
        title={deciding?.approve ? "Approve this application?" : "Decline this application?"}
        description={
          deciding && (
            <div className="space-y-3">
              <p>
                {deciding.approve
                  ? `${deciding.application.Member.firstName} ${deciding.application.Member.lastName} joins ${deciding.application.Course.title}. If they have not yet attended enough Sundays, the class opens once they have.`
                  : `${deciding.application.Member.firstName} will be told this application was not approved. They can apply again.`}
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={deciding.approve ? "A word for the record (optional)" : "What should they do next? (sent to them)"}
                className="w-full rounded-[12px] border border-gray-200 p-2 text-sm text-gray-900 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
              />
            </div>
          )
        }
        confirmLabel={deciding?.approve ? "Approve" : "Decline"}
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
