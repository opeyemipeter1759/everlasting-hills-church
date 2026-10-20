"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Mail, XCircle } from "lucide-react";
import { useApplications, useDecideApplication, type Application } from "@/lib/api/classes";
import { showToast } from "@/components/ui/toast/toast";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { ClassError, ClassLoading, ProgressBar, errorText, formatDate } from "../shared";

type Filter = "PENDING" | "APPROVED" | "DECLINED";
const FILTERS = ["PENDING", "APPROVED", "DECLINED"] as const;
const LABEL: Record<Filter, string> = { PENDING: "Waiting", APPROVED: "Approved", DECLINED: "Declined" };
const ATTENDING_LABEL: Record<string, string> = {
  under_1_month: "Less than a month",
  "1_to_3_months": "1 to 3 months",
  "3_to_12_months": "3 to 12 months",
  over_1_year: "More than a year",
};

const fullName = (a: Application) => `${a.Member.firstName} ${a.Member.lastName}`;

function since(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  return formatDate(iso);
}

function Avatar({ a, size = 40 }: { a: Application; size?: number }) {
  const { photoUrl, firstName, lastName } = a.Member;
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-[var(--color-chip)] font-semibold text-[var(--color-burgundy)] dark:bg-white/10 dark:text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {firstName[0]}
      {lastName[0]}
    </span>
  );
}

function Readiness({ a }: { a: Application }) {
  const { required, eligible, remaining } = a.eligibility;
  if (required === 0 || eligible) return <span className="cls-chip !bg-emerald-50 !text-emerald-700 dark:!bg-emerald-400/10 dark:!text-emerald-300">Ready to start</span>;
  return (
    <span className="cls-chip !bg-amber-50 !text-amber-800 dark:!bg-amber-400/10 dark:!text-amber-200">
      {remaining} Sunday{remaining === 1 ? "" : "s"} to go
    </span>
  );
}

/**
 * Applications to join a class, read like an inbox: who is waiting on the left,
 * the whole application on the right, and the decision made right under it.
 * A Super Admin, Pastor or Admin Head decides; the member is told either way,
 * and a decline must say what to do next because the note is sent to them.
 */
export default function ApplicationsTab({ courseSlug }: { courseSlug?: string }) {
  const [filter, setFilter] = useState<Filter>("PENDING");
  const lists = {
    PENDING: useApplications("PENDING"),
    APPROVED: useApplications("APPROVED"),
    DECLINED: useApplications("DECLINED"),
  };
  const { data: all, isLoading, error, refetch } = lists[filter];
  const forCourse = (rows: Application[] | undefined) => (courseSlug ? rows?.filter((a) => a.Course.slug === courseSlug) : rows);
  // Oldest first while waiting, so no one is left at the bottom; newest first once decided.
  const data = useMemo(() => {
    const rows = (courseSlug ? all?.filter((a) => a.Course.slug === courseSlug) : all) ?? [];
    return [...rows].sort((x, y) =>
      filter === "PENDING" ? x.enrolledAt.localeCompare(y.enrolledAt) : (y.decidedAt ?? "").localeCompare(x.decidedAt ?? ""),
    );
  }, [all, filter, courseSlug]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // On a phone the list and the application take turns; on a wide screen they sit side by side.
  const [reading, setReading] = useState(false);
  const selected = data.find((a) => a.id === selectedId) ?? data[0] ?? null;

  useEffect(() => {
    setSelectedId(null);
    setReading(false);
  }, [filter, courseSlug]);

  return (
    <div>
      <div role="group" aria-label="Show applications" className="inline-flex rounded-full border border-[var(--color-pink-border)] bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]">
        {FILTERS.map((f) => {
          const count = forCourse(lists[f].data)?.length;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                filter === f ? "bg-[var(--color-burgundy)] text-white" : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              }`}
            >
              {LABEL[f]}
              {count !== undefined && (
                <span className={`rounded-full px-1.5 text-xs ${filter === f ? "bg-white/20" : "bg-black/5 dark:bg-white/10"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading && <ClassLoading />}
      {error && <div className="mt-4"><ClassError error={error} onRetry={() => refetch()} /></div>}
      {all && data.length === 0 && (
        <div className="mt-6 rounded-[20px] border border-dashed border-[var(--color-pink-border)] p-10 text-center dark:border-white/15">
          <p className="font-semibold text-[var(--color-ink)] dark:text-white">
            {filter === "PENDING" ? "You're all caught up" : `No ${LABEL[filter].toLowerCase()} applications yet`}
          </p>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {filter === "PENDING" ? "New applications appear here as soon as a member applies to join a class." : "Applications move here once they are decided."}
          </p>
        </div>
      )}

      {all && data.length > 0 && selected && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <ul className={`space-y-2 ${reading ? "hidden lg:block" : ""}`} aria-label={`${LABEL[filter]} applications`}>
            {data.map((a) => {
              const active = a.id === selected.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(a.id);
                      setReading(true);
                    }}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-start gap-3 rounded-[16px] border p-3 text-left transition-colors ${
                      active
                        ? "border-[var(--color-burgundy)] bg-[var(--color-blush)] dark:border-[var(--color-gold)] dark:bg-white/[0.08]"
                        : "border-[var(--color-pink-border)] bg-white hover:border-[var(--color-burgundy)]/40 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/25"
                    }`}
                  >
                    <Avatar a={a} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-semibold text-[var(--color-ink)] dark:text-white">{fullName(a)}</span>
                        <span className="shrink-0 text-xs text-black/50 dark:text-white/50">{since(filter === "PENDING" ? a.enrolledAt : a.decidedAt ?? a.enrolledAt)}</span>
                      </span>
                      {!courseSlug && <span className="block truncate text-sm text-black/60 dark:text-white/60">{a.Course.title}</span>}
                      {a.applicationAnswers?.reason && (
                        <span className="mt-0.5 block truncate text-sm text-black/55 dark:text-white/55">{a.applicationAnswers.reason}</span>
                      )}
                      {filter === "PENDING" && <span className="mt-2 block"><Readiness a={a} /></span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className={reading ? "" : "hidden lg:block"}>
            <ApplicationDetail
              key={selected.id}
              application={selected}
              onBack={() => setReading(false)}
              onDecided={() => {
                // Move straight on to the next one waiting, so a stack can be cleared in one sitting.
                const i = data.findIndex((a) => a.id === selected.id);
                const next = data[i + 1] ?? data[i - 1] ?? null;
                setSelectedId(next?.id ?? null);
                if (!next) setReading(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationDetail({ application: a, onBack, onDecided }: { application: Application; onBack: () => void; onDecided: () => void }) {
  const decide = useDecideApplication();
  const [note, setNote] = useState("");
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [declineAsked, setDeclineAsked] = useState(false);
  const answers = a.applicationAnswers;
  const { required, attended, eligible, remaining } = a.eligibility;
  const pending = a.status === "PENDING";
  const noteMissing = declineAsked && !note.trim();

  async function submit(approve: boolean) {
    try {
      await decide.mutateAsync({ id: a.id, approve, note: note.trim() || undefined });
      showToast.success(approve ? `${fullName(a)} is approved for ${a.Course.title}` : `${a.Member.firstName} has been told, with your note`);
      setConfirmDecline(false);
      onDecided();
    } catch (err) {
      showToast.error(errorText(err));
    }
  }

  return (
    <article className="rounded-[20px] border border-[var(--color-pink-border)] bg-white dark:border-white/10 dark:bg-white/[0.04]">
      <header className="border-b border-[var(--color-pink-border)] p-5 dark:border-white/10">
        <button type="button" onClick={onBack} className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm text-black/60 lg:hidden dark:text-white/60">
          <ArrowLeft size={15} aria-hidden="true" /> All applications
        </button>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar a={a} size={56} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[var(--color-ink)] dark:text-white">{fullName(a)}</h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              Applied for {a.Course.title} on {formatDate(a.enrolledAt)} · {a.Member.membershipStatus === "FULL" ? "Full member" : "In training"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {a.Member.email && (
              <a href={`mailto:${a.Member.email}`} className="cls-btn cls-btn-outline !px-3 !py-1.5 !text-sm" aria-label={`Email ${a.Member.firstName}`}>
                <Mail size={14} aria-hidden="true" /> Email
              </a>
            )}
            <Link href={`/dashboard/admin/members/${a.Member.id}`} className="cls-btn cls-btn-outline !px-3 !py-1.5 !text-sm">
              Profile
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-6 p-5">
        {answers ? (
          <>
            <section>
              <h3 className="cls-eyebrow text-black/50 dark:text-white/50">Why they want to join</h3>
              <blockquote className="mt-2 border-l-4 border-[var(--color-burgundy)] pl-4 text-lg leading-relaxed text-[var(--color-ink)] dark:border-[var(--color-gold)] dark:text-white">
                {answers.reason}
              </blockquote>
            </section>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Fact label="Worshipping with us">{ATTENDING_LABEL[answers.attendingFor] ?? answers.attendingFor}</Fact>
              <Fact label="Given their life to Jesus">{answers.bornAgain === "yes" ? "Yes" : "Not sure yet"}</Fact>
              <Fact label="Home Cell">{answers.homeCell || <span className="text-black/45 dark:text-white/45">Not in one yet</span>}</Fact>
              {answers.notes && <Fact label="Anything else" wide>{answers.notes}</Fact>}
            </dl>
          </>
        ) : (
          <p className="text-sm text-black/60 dark:text-white/60">This application was made before the form existed, so there are no answers to show.</p>
        )}

        <section className="rounded-[16px] bg-[var(--color-blush)] p-4 dark:bg-white/[0.06]">
          <h3 className="cls-eyebrow text-black/50 dark:text-white/50">Sunday attendance</h3>
          {required > 0 ? (
            <>
              <p className="mt-1 text-sm text-[var(--color-ink)] dark:text-white">
                <strong>{attended} of {required}</strong> Sundays attended
                {eligible ? ", enough to start." : `. ${remaining} more before the class opens; you can still approve now.`}
              </p>
              <div className="mt-3"><ProgressBar pct={Math.round((Math.min(attended, required) / required) * 100)} label="Sundays attended" /></div>
            </>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-ink)] dark:text-white">This class has no attendance requirement.</p>
          )}
        </section>

        {pending ? (
          <section className="border-t border-[var(--color-pink-border)] pt-5 dark:border-white/10">
            <label htmlFor={`note-${a.id}`} className="block text-sm font-semibold text-[var(--color-ink)] dark:text-white">
              Note to {a.Member.firstName}
              <span className="font-normal text-black/50 dark:text-white/50"> · optional to approve, needed to decline</span>
            </label>
            <textarea
              id={`note-${a.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              aria-invalid={noteMissing || undefined}
              aria-describedby={noteMissing ? `note-err-${a.id}` : undefined}
              placeholder="e.g. Welcome! Your cohort starts on the first Sunday of the month."
              className={`mt-2 w-full rounded-[12px] border p-3 text-sm text-gray-900 dark:bg-white/[0.04] dark:text-white ${
                noteMissing ? "border-red-400" : "border-gray-200 dark:border-white/15"
              }`}
            />
            {noteMissing && (
              <p id={`note-err-${a.id}`} className="mt-1 text-sm text-red-600 dark:text-red-400">
                Tell {a.Member.firstName} why, and what to do next. This note is sent to them.
              </p>
            )}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={decide.isPending}
                onClick={() => {
                  setDeclineAsked(true);
                  if (note.trim()) setConfirmDecline(true);
                }}
                className="cls-btn cls-btn-outline !px-5 !py-2.5"
              >
                <XCircle size={16} aria-hidden="true" /> Decline
              </button>
              <button type="button" disabled={decide.isPending} onClick={() => submit(true)} className="cls-btn cls-btn-primary !px-5 !py-2.5">
                <CheckCircle2 size={16} aria-hidden="true" /> {decide.isPending ? "Saving…" : "Approve"}
              </button>
            </div>
          </section>
        ) : (
          <section className="flex items-start gap-3 border-t border-[var(--color-pink-border)] pt-5 dark:border-white/10">
            {a.status === "DECLINED" ? (
              <XCircle size={20} className="mt-0.5 shrink-0 text-black/50 dark:text-white/50" aria-hidden="true" />
            ) : a.status === "WAITING" ? (
              <Clock size={20} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
            )}
            <div className="text-sm">
              <p className="font-semibold text-[var(--color-ink)] dark:text-white">
                {a.status === "DECLINED" ? "Declined" : a.status === "WAITING" ? "Approved, waiting on Sundays" : "Approved"}
                {a.decidedAt ? ` on ${formatDate(a.decidedAt)}` : ""}
              </p>
              {a.decisionNote && <p className="mt-1 text-black/65 dark:text-white/65">&ldquo;{a.decisionNote}&rdquo;</p>}
            </div>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={confirmDecline}
        tone="warning"
        title={`Decline ${a.Member.firstName}'s application?`}
        description={
          <div className="space-y-3">
            <p>{a.Member.firstName} will get this note and can apply again.</p>
            <p className="rounded-[12px] bg-black/5 p-3 text-sm italic dark:bg-white/10">&ldquo;{note.trim()}&rdquo;</p>
          </div>
        }
        confirmLabel="Decline and send"
        loading={decide.isPending}
        onConfirm={() => submit(false)}
        onCancel={() => setConfirmDecline(false)}
      />
    </article>
  );
}

function Fact({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">{label}</dt>
      <dd className="mt-1 text-[var(--color-ink)] dark:text-white">{children}</dd>
    </div>
  );
}
