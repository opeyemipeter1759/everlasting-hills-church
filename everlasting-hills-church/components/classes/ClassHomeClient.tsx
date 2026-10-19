"use client";

import Link from "next/link";
import { useState } from "react";
import { Award, CalendarClock, Check, ChevronDown, CircleDashed, Lock, MapPin, PlayCircle } from "lucide-react";
import { useClassHome, useEnroll, type ClassHome, type LessonStatus } from "@/lib/api/classes";
import { showToast } from "@/components/ui/toast/toast";
import { ClassTheme } from "./theme";
import { ClassError, ClassLoading, ProgressBar, errorText, formatDate } from "./shared";

const STATUS_ICON: Record<LessonStatus, { icon: typeof Check; label: string; className: string }> = {
  done: { icon: Check, label: "Done", className: "bg-[var(--color-burgundy)] text-white" },
  in_progress: { icon: PlayCircle, label: "In progress", className: "bg-[var(--color-chip)] text-[var(--color-burgundy)]" },
  not_started: { icon: CircleDashed, label: "Not started", className: "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/60" },
  locked: { icon: Lock, label: "Locked", className: "bg-black/5 text-black/30 dark:bg-white/5 dark:text-white/30" },
};

export default function ClassHomeClient({ slug }: { slug: string }) {
  const { data, isLoading, error, refetch } = useClassHome(slug);
  if (isLoading) return <ClassTheme><ClassLoading /></ClassTheme>;
  if (error || !data) return <ClassTheme className="px-4 py-10"><ClassError error={error} onRetry={() => refetch()} /></ClassTheme>;
  return <ClassHomeView home={data} slug={slug} />;
}

function ClassHomeView({ home, slug }: { home: ClassHome; slug: string }) {
  const enroll = useEnroll(slug);
  const e = home.enrollment;
  const [openWeek, setOpenWeek] = useState<number>(e?.currentWeek ?? 1);
  const base = `/dashboard/classes/${slug}`;

  async function register() {
    try {
      const next = await enroll.mutateAsync();
      showToast.success(next.enrollment?.status === "WAITING" ? "You are registered. We will open the class when you are eligible." : "You are in. Welcome to the class.");
    } catch (err) {
      showToast.error(errorText(err, "Could not register you"));
    }
  }

  return (
    <ClassTheme className="pb-16">
      {/* Header band */}
      <section className="cls-glow cls-on-ink rounded-b-[20px] px-4 pb-10 pt-8 sm:rounded-[20px] sm:mx-4 sm:mt-4">
        <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <Link href="/dashboard/classes" className="cls-eyebrow text-[var(--color-gold)] hover:underline">
              Classes
            </Link>
            <h1 className="cls-display mt-3 text-4xl sm:text-5xl">{home.class.title}</h1>
            <p className="mt-3 max-w-xl text-white/65">{home.class.description}</p>
          </div>

          <div className="cls-glass rounded-[20px] p-6">
            {e ? (
              e.status === "WAITING" ? (
                <>
                  <p className="cls-eyebrow text-white/60">Registered</p>
                  <p className="cls-display mt-2 text-2xl">
                    {home.eligibility.attended} of {home.eligibility.required} Sundays
                  </p>
                  <div className="mt-4"><ProgressBar pct={(home.eligibility.attended / Math.max(1, home.eligibility.required)) * 100} label="Sundays attended" /></div>
                  <p className="mt-4 text-sm text-white/65">
                    Your lessons open after {home.eligibility.remaining} more Sunday{home.eligibility.remaining === 1 ? "" : "s"}.
                    {e.cohort ? ` You are placed in the ${e.cohort.name} cohort.` : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="cls-eyebrow text-white/60">
                    {e.status === "COMPLETED" ? "Completed" : `Week ${e.currentWeek} of ${home.class.weeks.length}`}
                  </p>
                  <p className="cls-display mt-2 text-5xl">{e.progressPct}%</p>
                  <div className="mt-4"><ProgressBar pct={e.progressPct} label="Class progress" /></div>
                  {e.cohort?.nextSession && (
                    <p className="mt-4 flex items-start gap-2 text-sm text-white/70">
                      <CalendarClock className="mt-0.5 h-4 w-4 flex-none text-[var(--color-gold)]" aria-hidden />
                      <span>
                        Next session: {e.cohort.nextSession.title}, {formatDate(e.cohort.nextSession.startsAt, true)}
                        {e.cohort.nextSession.location ? ` at ${e.cohort.nextSession.location}` : ""}
                      </span>
                    </p>
                  )}
                  {e.status === "COMPLETED" ? (
                    <Link href={`${base}/certificate`} className="cls-btn cls-btn-primary mt-5 w-full sm:w-auto">
                      <Award className="h-4 w-4" aria-hidden /> Your certificate
                    </Link>
                  ) : e.next ? (
                    <Link href={`${base}/${e.next.week}/${e.next.slug}`} className="cls-btn cls-btn-primary mt-5 w-full sm:w-auto">
                      Continue
                    </Link>
                  ) : e.cohort && e.cohort.minSessions > e.cohort.sessionsAttended ? (
                    <p className="mt-4 text-sm text-white/70">
                      Lessons done. Attend {e.cohort.minSessions - e.cohort.sessionsAttended} more session
                      {e.cohort.minSessions - e.cohort.sessionsAttended === 1 ? "" : "s"} to finish.
                    </p>
                  ) : null}
                </>
              )
            ) : (
              <>
                <p className="cls-eyebrow text-white/60">Your eligibility</p>
                <p className="cls-display mt-2 text-2xl">
                  {home.blocker
                    ? home.blocker
                    : home.eligibility.eligible
                      ? "You're eligible: start now."
                      : `Keep attending: ${home.eligibility.attended} of ${home.eligibility.required} weeks complete.`}
                </p>
                {home.canEnroll && (
                  <>
                    <p className="mt-3 text-sm text-white/65">
                      {home.eligibility.eligible
                        ? "Register and we will place you in the current cohort."
                        : "Register now and we will place you in the next cohort after you are eligible."}
                    </p>
                    <button type="button" onClick={register} disabled={enroll.isPending} className="cls-btn cls-btn-primary mt-5 w-full sm:w-auto">
                      {enroll.isPending ? "Registering..." : "Start the Class"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 grid max-w-[1200px] gap-10 px-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Weeks */}
        <div className="space-y-4">
          {home.class.weeks.map((w) => {
            const open = openWeek === w.number;
            const done = w.lessons.filter((l) => l.status === "done").length;
            return (
              <div key={w.number} className="rounded-[16px] border border-[var(--color-pink-border)] bg-white dark:border-white/10 dark:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setOpenWeek(open ? 0 : w.number)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-4 p-6 text-left"
                >
                  <span>
                    <span className="cls-eyebrow text-[var(--color-crimson)] dark:text-[var(--color-gold)]">
                      Week {w.number}{w.stage ? ` · ${w.stage}` : ""}
                    </span>
                    <span className="cls-display mt-1 block text-2xl sm:text-[32px] text-[var(--color-ink)] dark:text-white">{w.title}</span>
                    {w.subtitle && <span className="mt-1 block italic text-black/60 dark:text-white/60">{w.subtitle}</span>}
                    <span className="cls-chip mt-3">{done} of {w.lessons.length} lessons</span>
                  </span>
                  <ChevronDown className={`mt-2 h-5 w-5 flex-none text-black/50 transition-transform duration-[400ms] dark:text-white/50 ${open ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {open && (
                  <ol className="divide-y divide-[var(--color-pink-border)] border-t border-[var(--color-pink-border)] dark:divide-white/10 dark:border-white/10">
                    {w.lessons.map((l) => {
                      const s = STATUS_ICON[l.status];
                      const Icon = s.icon;
                      const row = (
                        <>
                          <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${s.className}`} title={s.label}>
                            <Icon className="h-4 w-4" aria-hidden />
                            <span className="sr-only">{s.label}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-[var(--color-ink)] dark:text-white">{l.number}. {l.title}</span>
                            {l.description && <span className="block text-sm text-black/60 dark:text-white/60">{l.description}</span>}
                          </span>
                        </>
                      );
                      return (
                        <li key={l.id}>
                          {l.status === "locked" ? (
                            <div className="flex items-start gap-4 px-6 py-4 opacity-70">{row}</div>
                          ) : (
                            <Link href={`${base}/${w.number}/${l.slug}`} className="flex items-start gap-4 px-6 py-4 hover:bg-[var(--color-blush)] dark:hover:bg-white/[0.04]">
                              {row}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            );
          })}
        </div>

        {/* Side: the cohort and its sessions */}
        <aside className="space-y-6">
          {e?.cohort && (
            <div className="rounded-[20px] border border-[var(--color-pink-border)] bg-[var(--color-blush)] p-6 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="cls-eyebrow text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">Your cohort</p>
              <p className="cls-display mt-2 text-2xl text-[var(--color-ink)] dark:text-white">{e.cohort.name}</p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">Starts {formatDate(e.cohort.startsOn)}</p>
              {e.cohort.minSessions > 0 && (
                <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                  In-person sessions attended: <strong>{e.cohort.sessionsAttended}</strong> of {e.cohort.minSessions} needed
                </p>
              )}
              {e.cohort.nextSession?.location && (
                <p className="mt-2 flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                  <MapPin className="h-4 w-4" aria-hidden /> {e.cohort.nextSession.location}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </ClassTheme>
  );
}
