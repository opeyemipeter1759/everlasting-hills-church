"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { useMarkSession, useRoster, useVerifyAction } from "@/lib/api/classes";
import { showToast } from "@/components/ui/toast/toast";
import { ClassTheme } from "./theme";
import { ClassError, ClassLoading, ProgressBar, errorText, formatDate } from "./shared";

/**
 * A cohort's learners: progress, session attendance and action steps to
 * verify. Used by facilitators (My Classes) and by staff (admin Classes).
 */
export default function RosterClient({ cohortId, backHref = "/dashboard/classes", embedded = false }: { cohortId: string; backHref?: string; embedded?: boolean }) {
  const { data, isLoading, error, refetch } = useRoster(cohortId);
  const mark = useMarkSession(cohortId);
  const verify = useVerifyAction(cohortId);

  if (isLoading) return <ClassTheme><ClassLoading /></ClassTheme>;
  if (error || !data) return <ClassTheme className="px-4 py-10"><ClassError error={error} onRetry={() => refetch()} /></ClassTheme>;

  async function toggle(sessionId: string, memberId: string, present: boolean) {
    try {
      await mark.mutateAsync({ sessionId, memberId, present });
    } catch (err) {
      showToast.error(errorText(err));
    }
  }

  async function verifyStep(actionId: string, verified: boolean) {
    try {
      await verify.mutateAsync({ actionId, verified });
    } catch (err) {
      showToast.error(errorText(err));
    }
  }

  const toVerify = data.learners.flatMap((l) => l.actions.filter((a) => a.needsLeader && !a.verifiedAt).map((a) => ({ ...a, learner: l.member.name })));

  return (
    <ClassTheme className={embedded ? "" : "mx-auto max-w-[1200px] px-4 py-8"}>
      {!embedded && (
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-black/60 hover:underline dark:text-white/60">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </Link>
      )}
      <p className="cls-eyebrow mt-4 text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">{data.course.title}</p>
      <h1 className="cls-display mt-1 text-3xl sm:text-4xl text-[var(--color-ink)] dark:text-white">{data.name}</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Starts {formatDate(data.startsOn)} · {data.learners.length} learner{data.learners.length === 1 ? "" : "s"}
        {data.minSessions > 0 ? ` · ${data.minSessions} sessions needed` : ""}
      </p>

      {/* Learners */}
      <div className="mt-8 overflow-x-auto rounded-[16px] border border-[var(--color-pink-border)] bg-white dark:border-white/10 dark:bg-white/[0.04]">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-pink-border)] text-left text-black/55 dark:border-white/10 dark:text-white/55">
              <th className="p-3 font-semibold">Learner</th>
              <th className="p-3 font-semibold">Progress</th>
              {data.sessions.map((s) => (
                <th key={s.id} className="p-3 text-center font-semibold" title={`${s.title}, ${formatDate(s.startsAt, true)}`}>
                  {s.weekNumber ? `Wk ${s.weekNumber}` : formatDate(s.startsAt)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.learners.length === 0 && (
              <tr>
                <td colSpan={2 + data.sessions.length} className="p-6 text-center text-black/50 dark:text-white/50">
                  No one is in this cohort yet.
                </td>
              </tr>
            )}
            {data.learners.map((l) => (
              <tr key={l.enrollmentId} className="border-b border-[var(--color-pink-border)] last:border-0 dark:border-white/10">
                <td className="p-3">
                  <span className="block font-semibold text-[var(--color-ink)] dark:text-white">{l.member.name}</span>
                  <span className="block text-xs text-black/50 dark:text-white/50">
                    {l.member.phone ?? l.member.email ?? ""}
                    {l.status === "WAITING" ? " · waiting for eligibility" : l.status === "COMPLETED" ? " · completed" : ""}
                  </span>
                  {l.stalled && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> No progress for 3 weeks
                    </span>
                  )}
                </td>
                <td className="w-40 p-3">
                  <div className="mb-1 text-xs text-black/55 dark:text-white/55">
                    {l.completedLessons}/{l.totalLessons} lessons
                  </div>
                  <ProgressBar pct={l.progressPct} label={`${l.member.name} progress`} />
                </td>
                {data.sessions.map((s) => {
                  const present = s.attendees.includes(l.member.id);
                  return (
                    <td key={s.id} className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(s.id, l.member.id, !present)}
                        disabled={mark.isPending}
                        aria-pressed={present}
                        aria-label={`${l.member.name} at ${s.title}: ${present ? "present" : "not marked"}`}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                          present ? "border-[var(--color-burgundy)] bg-[var(--color-burgundy)] text-white" : "border-[var(--color-pink-border)] text-transparent hover:text-black/30 dark:border-white/20"
                        }`}
                      >
                        <Check className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action steps to verify */}
      <section className="mt-10">
        <h2 className="cls-display text-2xl text-[var(--color-ink)] dark:text-white">Action steps to verify</h2>
        {toVerify.length === 0 ? (
          <p className="mt-3 text-sm text-black/55 dark:text-white/55">Nothing waiting. Steps that need a leader appear here once a learner marks them done.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {toVerify.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 rounded-[16px] border border-[var(--color-pink-border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.04]">
                <span>
                  <span className="block font-semibold text-[var(--color-ink)] dark:text-white">{a.learner}</span>
                  <span className="block text-sm text-black/60 dark:text-white/60">
                    {a.lessonTitle} · marked done {formatDate(a.doneAt)}
                    {a.note ? ` · "${a.note}"` : ""}
                  </span>
                </span>
                <button type="button" onClick={() => verifyStep(a.id, true)} disabled={verify.isPending} className="cls-btn cls-btn-primary">
                  <ShieldCheck className="h-4 w-4" aria-hidden /> Verify
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ClassTheme>
  );
}
