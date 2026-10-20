"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { useClasses, useFacilitating, type ClassListItem, type MembershipStatus } from "@/lib/api/classes";
import { ClassTheme, EmphasisHeading } from "./theme";
import Arches from "./Arches";
import { ClassError, ClassLoading, formatDate } from "./shared";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Where the learner stands in one class, in a few quiet words. */
function standing(c: ClassListItem, membership: MembershipStatus): { text: string; tone: "done" | "active" | "waiting" | "closed" } {
  const e = c.enrollment;
  if (e?.status === "COMPLETED") return { text: `Complete, ${formatDate(e.completedAt)}`, tone: "done" };
  if (e?.status === "ACTIVE") return { text: e.completedLessons === 0 ? "Ready to begin" : `${e.completedLessons} of ${c.totalLessons} lessons complete`, tone: "active" };
  if (e?.status === "WAITING") return { text: "Approved, opens soon", tone: "waiting" };
  if (e?.status === "PENDING") return { text: "Application sent", tone: "waiting" };
  if (e?.status === "DECLINED") return { text: "Not approved this time. You can apply again.", tone: "waiting" };
  if (c.requiresFullMembership && membership !== "FULL") return { text: "Opens to full members", tone: "closed" };
  if (!c.prerequisiteMet) return { text: "Opens after the class before it", tone: "closed" };
  return { text: c.eligibility.eligible ? "You can apply" : `${c.eligibility.attended} of ${c.eligibility.required} Sundays so far`, tone: "waiting" };
}

/** A class this member can apply to now: not in it, not waiting on a decision, and nothing standing in the way. */
function canApply(c: ClassListItem, membership: MembershipStatus): boolean {
  const e = c.enrollment;
  if (e && e.status !== "DECLINED") return false;
  if (c.requiresFullMembership && membership !== "FULL") return false;
  return c.prerequisiteMet;
}

export default function MyClassesClient() {
  const reduceMotion = useReducedMotion();
  const { data, isLoading, error, refetch } = useClasses();
  const { data: facilitating } = useFacilitating();

  return (
    <ClassTheme className="mx-auto max-w-[1000px] px-4 py-8 sm:py-12">
      <header className="relative">
        <Arches className="absolute -top-6 right-0 hidden h-28 w-auto text-[var(--color-burgundy)] sm:block" />
        <EmphasisHeading as="h1" before="Grow in the" emphasis="house." className="text-[40px] leading-[1.02] text-[var(--color-ink)] dark:text-white sm:text-6xl" />
        {data && (
          <p className="mt-4 max-w-xl text-lg text-black/60 dark:text-white/60">
            {data.membershipStatus === "FULL"
              ? "You are a full member of Everlasting Hills Church. Keep growing."
              : "You are a member in training. The Membership Class is your next step."}
          </p>
        )}
      </header>

      {isLoading && <ClassLoading />}
      {error && <div className="mt-8"><ClassError error={error} onRetry={() => refetch()} /></div>}
      {data && data.classes.length === 0 && <p className="mt-10 text-black/60 dark:text-white/60">No classes are open yet. Check back soon.</p>}

      {data && data.classes.length > 0 && (
        <ol className="mt-10 border-t border-[var(--color-pink-border)] dark:border-white/10">
          {data.classes.map((c, i) => {
            const s = standing(c, data.membershipStatus);
            const progress = c.enrollment?.status === "ACTIVE" ? c.enrollment.progressPct : null;
            return (
              <motion.li
                key={c.slug}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.06 }}
                className="border-b border-[var(--color-pink-border)] dark:border-white/10"
              >
                <Link
                  href={`/dashboard/classes/${c.slug}`}
                  className="group grid gap-3 py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)] sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8"
                >
                  <span className="min-w-0">
                    <span className={`cls-display block text-[28px] leading-tight sm:text-4xl ${s.tone === "closed" ? "text-black/50 dark:text-white/50" : "text-[var(--color-ink)] dark:text-white"}`}>
                      {c.title}
                    </span>
                    {c.tagline && <span className="mt-1 block text-black/60 dark:text-white/60">{c.tagline}</span>}
                    {progress !== null && (
                      <span className="mt-4 block h-1 max-w-sm overflow-hidden rounded-full bg-[var(--color-pink-border)] dark:bg-white/10" aria-hidden="true">
                        <span className="block h-full rounded-full bg-[var(--color-gold)]" style={{ width: `${progress}%` }} />
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        s.tone === "done"
                          ? "bg-[var(--color-chip)] font-semibold text-[var(--color-burgundy)] dark:bg-white/10 dark:text-[var(--color-gold)]"
                          : s.tone === "active"
                            ? "bg-[var(--color-burgundy)] text-white"
                            : "bg-black/[0.04] text-black/60 dark:bg-white/10 dark:text-white/65"
                      }`}
                    >
                      {s.text}
                    </span>
                    <ArrowRight className="h-5 w-5 flex-none text-[var(--color-burgundy)] transition-transform group-hover:translate-x-1 dark:text-white/70" aria-hidden />
                  </span>
                </Link>
                {canApply(c, data.membershipStatus) && (
                  <div className="-mt-3 pb-7">
                    <Link href={`/dashboard/classes/${c.slug}/apply`} className="cls-btn cls-btn-primary !px-6 !py-2.5 !text-sm">
                      {c.enrollment?.status === "DECLINED" ? "Apply again" : "Enrol"}
                    </Link>
                  </div>
                )}
              </motion.li>
            );
          })}
        </ol>
      )}

      {facilitating && facilitating.length > 0 && (
        <section className="mt-14">
          <h2 className="cls-display text-2xl text-[var(--color-ink)] dark:text-white">Cohorts you facilitate</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {facilitating.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/classes/facilitate/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--color-pink-border)] bg-white p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)] dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <span>
                    <span className="block font-semibold text-[var(--color-ink)] dark:text-white">{c.Course.title}: {c.name}</span>
                    <span className="block text-sm text-black/60 dark:text-white/60">Began {formatDate(c.startsOn)}</span>
                  </span>
                  <span className="cls-chip"><Users className="h-3.5 w-3.5" aria-hidden />{c._count.Enrollments}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ClassTheme>
  );
}
