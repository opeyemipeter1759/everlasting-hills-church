"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarClock, Check, ChevronDown, MapPin } from "lucide-react";
import { useClassHome, useEnroll, type ClassHome, type LessonStatus } from "@/lib/api/classes";
import { showToast } from "@/components/ui/toast/toast";
import { ClassTheme } from "./theme";
import Arches from "./Arches";
import { WEEK_VERSES } from "./membership-content";
import { ClassError, ClassLoading, errorText, formatDate } from "./shared";

const EASE = [0.22, 1, 0.36, 1] as const;

type Week = ClassHome["class"]["weeks"][number];
type WeekState = "complete" | "open" | "locked";

function weekState(w: Week): WeekState {
  if (w.lessons.length > 0 && w.lessons.every((l) => l.status === "done")) return "complete";
  if (w.lessons.every((l) => l.status === "locked")) return "locked";
  return "open";
}

export default function ClassHomeClient({ slug }: { slug: string }) {
  const { data, isLoading, error, refetch } = useClassHome(slug);
  if (isLoading) return <ClassTheme><ClassLoading /></ClassTheme>;
  if (error || !data) return <ClassTheme className="px-4 py-10"><ClassError error={error} onRetry={() => refetch()} /></ClassTheme>;
  return <ClassHomeView home={data} slug={slug} />;
}

/**
 * A class as a covenant journey: four stations on one path, each week framed by
 * an arch, with its anchor verse. Progress is told as growth, never as points;
 * gold is kept for progress and completion alone.
 */
function ClassHomeView({ home, slug }: { home: ClassHome; slug: string }) {
  const reduceMotion = useReducedMotion();
  const enroll = useEnroll(slug);
  const e = home.enrollment;
  const base = `/dashboard/classes/${slug}`;
  const weeks = home.class.weeks;
  const states = weeks.map(weekState);
  const firstOpen = weeks.find((_, i) => states[i] === "open")?.number ?? (e?.currentWeek ?? 1);
  const [openWeek, setOpenWeek] = useState<number>(firstOpen);
  const verses = WEEK_VERSES[slug] ?? {};

  async function apply() {
    try {
      const next = await enroll.mutateAsync();
      showToast.success(next.enrollment?.status === "PENDING" ? "Application sent. A pastor or admin will review it." : "Done.");
    } catch (err) {
      showToast.error(errorText(err, "Could not send your application"));
    }
  }

  return (
    <ClassTheme className="pb-16">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="cls-glow cls-on-ink relative overflow-hidden rounded-b-[24px] px-4 pb-10 pt-8 sm:mx-4 sm:mt-4 sm:rounded-[24px] sm:px-8 sm:pb-12"
      >
        <Arches className="absolute -bottom-2 right-0 hidden h-[85%] w-auto text-white md:block" />
        <div className="relative mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <Link href="/dashboard/classes" className="text-sm text-white/60 hover:text-white">
              Classes
            </Link>
            <h1 className="cls-display mt-3 text-[40px] leading-[1.02] sm:text-6xl">{home.class.title}</h1>
            {home.class.description && <p className="mt-4 max-w-xl text-lg text-white/65">{home.class.description}</p>}
          </div>
          <StatusPanel home={home} base={base} onApply={apply} applying={enroll.isPending} />
        </div>
      </motion.section>

      <div className="mx-auto mt-12 grid max-w-[1100px] gap-12 px-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="The four weeks">
          <h2 className="cls-display text-3xl text-[var(--color-ink)] dark:text-white sm:text-4xl">The path</h2>
          <p className="mt-2 text-black/60 dark:text-white/60">One week at a time. Each opens when the one before it is complete.</p>

          <ol className="relative mt-10">
            {/* The path, drawn once on the first visit. */}
            <span aria-hidden="true" className="absolute bottom-4 left-[19px] top-2 w-[2px] rounded-full bg-[var(--color-pink-border)] dark:bg-white/15" />
            <motion.span
              aria-hidden="true"
              className="absolute left-[19px] top-2 w-[2px] origin-top rounded-full bg-[var(--color-burgundy)]"
              style={{ height: `calc((100% - 1.5rem) * ${weeks.length ? states.filter((st) => st === "complete").length / weeks.length : 0})` }}
              initial={reduceMotion ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
            />

            {weeks.map((w, i) => {
              const state = states[i];
              const verse = verses[w.number];
              const open = openWeek === w.number;
              const done = w.lessons.filter((l) => l.status === "done").length;
              return (
                <motion.li
                  key={w.number}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.15 + i * 0.08 }}
                  className="relative pb-10 pl-14 last:pb-0"
                >
                  <Station state={state} number={w.number} />
                  <article
                    className={`overflow-hidden rounded-t-[56px] rounded-b-[20px] border bg-white dark:bg-white/[0.04] ${
                      state === "locked" ? "border-[var(--color-pink-border)]/70 dark:border-white/10" : "border-[var(--color-pink-border)] dark:border-white/15"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenWeek(open ? 0 : w.number)}
                      aria-expanded={open}
                      className="flex w-full items-start justify-between gap-4 px-6 pb-5 pt-8 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-burgundy)] sm:px-8"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">
                          Week {w.number}
                          {w.stage && <span className="text-black/45 dark:text-white/50">{w.stage}</span>}
                          <StateChip state={state} previous={w.number - 1} />
                        </span>
                        <span className={`cls-display mt-2 block text-[28px] leading-tight sm:text-[34px] ${state === "locked" ? "text-black/55 dark:text-white/55" : "text-[var(--color-ink)] dark:text-white"}`}>
                          {w.title}
                        </span>
                        {w.subtitle && <span className="mt-1 block italic text-black/60 dark:text-white/60">{w.subtitle}</span>}
                      </span>
                      <ChevronDown className={`mt-8 h-5 w-5 flex-none text-black/40 transition-transform duration-300 dark:text-white/50 ${open ? "rotate-180" : ""}`} aria-hidden />
                    </button>

                    {verse && (
                      <blockquote className="mx-6 mb-6 border-l-2 border-[var(--color-burgundy)]/40 pl-4 sm:mx-8">
                        <p className="cls-display text-lg italic leading-snug text-black/70 dark:text-white/75">{verse.text}</p>
                        <cite className="mt-1 block text-sm not-italic text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">{verse.ref}</cite>
                      </blockquote>
                    )}

                    {open && (
                      <ol className="border-t border-[var(--color-pink-border)] dark:border-white/10">
                        {w.lessons.map((l) => (
                          <li key={l.id} className="border-b border-[var(--color-pink-border)] last:border-b-0 dark:border-white/10">
                            {l.status === "locked" ? (
                              <div className="flex items-start gap-4 px-6 py-4 sm:px-8">
                                <LessonMark status={l.status} />
                                <LessonText week={w.number} number={l.number} title={l.title} description={l.description} muted />
                              </div>
                            ) : (
                              <Link
                                href={`${base}/${w.number}/${l.slug}`}
                                className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[var(--color-blush)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-burgundy)] dark:hover:bg-white/[0.04] sm:px-8"
                              >
                                <LessonMark status={l.status} />
                                <LessonText week={w.number} number={l.number} title={l.title} description={l.description} />
                                <ArrowRight className="mt-1 h-4 w-4 flex-none text-black/30 transition-transform group-hover:translate-x-0.5 dark:text-white/40" aria-hidden />
                              </Link>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                    {!open && (
                      <p className="px-6 pb-6 text-sm text-black/50 dark:text-white/50 sm:px-8">
                        {done} of {w.lessons.length} lessons complete
                      </p>
                    )}
                  </article>
                </motion.li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-6 lg:pt-24">
          {e?.cohort && (
            <div className="rounded-[20px] border border-[var(--color-pink-border)] bg-[var(--color-blush)] p-6 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-sm text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">Your cohort</p>
              <p className="cls-display mt-1 text-2xl text-[var(--color-ink)] dark:text-white">{e.cohort.name}</p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">Began {formatDate(e.cohort.startsOn)}</p>
              {e.cohort.minSessions > 0 && (
                <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                  Sunday sessions attended: {e.cohort.sessionsAttended} of {e.cohort.minSessions}
                </p>
              )}
              {e.cohort.nextSession && (
                <p className="mt-3 flex items-start gap-2 text-sm text-black/70 dark:text-white/70">
                  <CalendarClock className="mt-0.5 h-4 w-4 flex-none text-[var(--color-burgundy)] dark:text-white/70" aria-hidden />
                  <span>
                    {e.cohort.nextSession.title}, {formatDate(e.cohort.nextSession.startsAt, true)}
                  </span>
                </p>
              )}
              {e.cohort.nextSession?.location && (
                <p className="mt-2 flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                  <MapPin className="h-4 w-4" aria-hidden /> {e.cohort.nextSession.location}
                </p>
              )}
            </div>
          )}
          <p className="text-sm italic text-black/50 dark:text-white/50">Planted by God, Preserved in Prayer.</p>
        </aside>
      </div>
    </ClassTheme>
  );
}

/** Where the learner stands, in words. No large numbers, no points. */
function StatusPanel({ home, base, onApply, applying }: { home: ClassHome; base: string; onApply: () => void; applying: boolean }) {
  const e = home.enrollment;
  const el = home.eligibility;
  const panel = "cls-glass rounded-[20px] p-6";

  if (e?.status === "PENDING") {
    return (
      <div className={panel}>
        <p className="text-sm text-white/60">Application sent</p>
        <p className="cls-display mt-1 text-2xl">Waiting for approval</p>
        <p className="mt-3 text-sm text-white/65">A Super Admin, Pastor or Admin Head reviews every application. You will get a message in your inbox when it is decided.</p>
      </div>
    );
  }
  if (e?.status === "DECLINED") {
    return (
      <div className={panel}>
        <p className="text-sm text-white/60">Not approved this time</p>
        <p className="mt-2 text-white/80">{e.decisionNote || "The church office will be in touch about your next step."}</p>
        {home.canEnroll && (
          <button type="button" onClick={onApply} disabled={applying} className="cls-btn cls-btn-primary mt-5 w-full sm:w-auto">
            {applying ? "Sending..." : "Apply again"}
          </button>
        )}
      </div>
    );
  }
  if (e?.status === "WAITING") {
    return (
      <div className={panel}>
        <p className="text-sm text-white/60">Approved</p>
        <p className="cls-display mt-1 text-2xl">Your class opens soon</p>
        <p className="mt-3 text-sm text-white/65">
          It opens after {el.remaining} more Sunday{el.remaining === 1 ? "" : "s"} with us. {el.attended} of {el.required} so far.
          {e.cohort ? ` You are in the ${e.cohort.name} cohort.` : ""}
        </p>
      </div>
    );
  }
  if (e?.status === "COMPLETED") {
    return (
      <div className={panel}>
        <p className="text-sm text-[var(--color-gold)]">Complete</p>
        <p className="cls-display mt-1 text-2xl">You have walked the whole path.</p>
        <Link href={`${base}/certificate`} className="cls-btn cls-btn-primary mt-5 w-full sm:w-auto">
          See your certificate
        </Link>
      </div>
    );
  }
  if (e) {
    return (
      <div className={panel}>
        <p className="text-sm text-white/60">Week {e.currentWeek} of {home.class.weeks.length}</p>
        <p className="cls-display mt-1 text-2xl">{e.completedLessons === 0 ? "Your first lesson is ready." : `${e.completedLessons} of ${e.totalLessons} lessons complete.`}</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
          <div className="h-full rounded-full bg-[var(--color-gold)]" style={{ width: `${e.progressPct}%` }} />
        </div>
        {e.next ? (
          <Link href={`${base}/${e.next.week}/${e.next.slug}`} className="cls-btn cls-btn-primary mt-5 w-full sm:w-auto">
            {e.completedLessons === 0 ? "Begin" : "Continue"} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : e.cohort && e.cohort.minSessions > e.cohort.sessionsAttended ? (
          <p className="mt-4 text-sm text-white/70">
            Lessons done. Attend {e.cohort.minSessions - e.cohort.sessionsAttended} more Sunday session
            {e.cohort.minSessions - e.cohort.sessionsAttended === 1 ? "" : "s"} to finish.
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className={panel}>
      <p className="text-sm text-white/60">Joining this class</p>
      <p className="cls-display mt-1 text-2xl">
        {home.blocker ? home.blocker : el.eligible ? "You can apply to join." : `${el.attended} of ${el.required} Sundays so far.`}
      </p>
      {home.canEnroll && (
        <>
          <p className="mt-3 text-sm text-white/65">
            {el.eligible
              ? "A Super Admin, Pastor or Admin Head reviews every application."
              : "You can apply now. The class opens once you are approved and have attended enough Sundays."}
          </p>
          <button type="button" onClick={onApply} disabled={applying} className="cls-btn cls-btn-primary mt-5 w-full sm:w-auto">
            {applying ? "Sending..." : "Apply to join"}
          </button>
        </>
      )}
    </div>
  );
}

function Station({ state, number }: { state: WeekState; number: number }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute left-0 top-6 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums ${
        state === "complete"
          ? "border-[var(--color-burgundy)] bg-[var(--color-burgundy)] text-white"
          : state === "open"
            ? "border-[var(--color-burgundy)] bg-white text-[var(--color-burgundy)] dark:bg-[var(--color-ink)]"
            : "border-[var(--color-pink-border)] bg-white text-black/40 dark:border-white/20 dark:bg-[var(--color-ink)] dark:text-white/40"
      }`}
    >
      {state === "complete" ? <Check className="h-4 w-4" /> : number}
    </span>
  );
}

function StateChip({ state, previous }: { state: WeekState; previous: number }) {
  if (state === "complete") return <span className="rounded-full bg-[var(--color-chip)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-burgundy)] dark:bg-white/10 dark:text-[var(--color-gold)]">Complete</span>;
  if (state === "locked")
    return <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-xs text-black/55 dark:bg-white/10 dark:text-white/60">{previous > 0 ? `Opens after Week ${previous}` : "Opens when you are approved"}</span>;
  return null;
}

function LessonMark({ status }: { status: LessonStatus }) {
  const base = "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border";
  if (status === "done") return <span className={`${base} border-[var(--color-burgundy)] bg-[var(--color-burgundy)] text-white`}><Check className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">Complete</span></span>;
  if (status === "in_progress") return <span className={`${base} border-[var(--color-burgundy)]`}><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-burgundy)]" /><span className="sr-only">In progress</span></span>;
  if (status === "not_started") return <span className={`${base} border-[var(--color-burgundy)]/60`}><span className="sr-only">Ready to start</span></span>;
  return <span className={`${base} border-dashed border-black/20 dark:border-white/20`}><span className="sr-only">Opens after the lesson before it</span></span>;
}

function LessonText({ week, number, title, description, muted = false }: { week: number; number: number; title: string; description: string | null; muted?: boolean }) {
  return (
    <span className="min-w-0 flex-1">
      <span className={`block font-semibold ${muted ? "text-black/50 dark:text-white/45" : "text-[var(--color-ink)] dark:text-white"}`}>
        <span className="mr-2 text-sm tabular-nums text-black/40 dark:text-white/40">{week}.{number}</span>
        {title}
      </span>
      {description && <span className={`mt-0.5 block text-sm ${muted ? "text-black/40 dark:text-white/35" : "text-black/60 dark:text-white/60"}`}>{description}</span>}
    </span>
  );
}
