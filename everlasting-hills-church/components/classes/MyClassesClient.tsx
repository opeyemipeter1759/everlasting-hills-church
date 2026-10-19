"use client";

import Link from "next/link";
import { ArrowRight, Award, Lock, Users } from "lucide-react";
import { useClasses, useFacilitating } from "@/lib/api/classes";
import { ClassTheme, EmphasisHeading } from "./theme";
import { ClassError, ClassLoading, ProgressBar, formatDate } from "./shared";

export default function MyClassesClient() {
  const { data, isLoading, error, refetch } = useClasses();
  const { data: facilitating } = useFacilitating();

  return (
    <ClassTheme className="mx-auto max-w-[1200px] px-4 py-8 sm:py-10">
      <p className="cls-eyebrow text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">Classes</p>
      <EmphasisHeading as="h1" before="Grow in the" emphasis="house." className="mt-2 text-4xl sm:text-5xl text-[var(--color-ink)] dark:text-white" />
      {data && (
        <p className="mt-3 text-black/60 dark:text-white/60">
          {data.membershipStatus === "FULL"
            ? "You are a full member of Everlasting Hills Church."
            : "You are a member in training. The Membership Class is your next step."}
        </p>
      )}

      {isLoading && <ClassLoading />}
      {error && <div className="mt-8"><ClassError error={error} onRetry={() => refetch()} /></div>}

      {data && data.classes.length === 0 && (
        <p className="mt-10 text-black/60 dark:text-white/60">No classes are open yet. Check back soon.</p>
      )}

      {data && data.classes.length > 0 && (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {data.classes.map((c) => {
            const e = c.enrollment;
            const locked = !e && (!c.prerequisiteMet || (c.requiresFullMembership && data.membershipStatus !== "FULL"));
            return (
              <li key={c.slug}>
                <Link
                  href={`/dashboard/classes/${c.slug}`}
                  className="group block h-full rounded-[20px] border border-[var(--color-pink-border)] bg-white p-6 transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="cls-display text-2xl text-[var(--color-ink)] dark:text-white">{c.title}</p>
                      <p className="mt-1 text-sm text-black/60 dark:text-white/60">{c.tagline}</p>
                    </div>
                    {e?.status === "COMPLETED" ? (
                      <Award className="h-6 w-6 flex-none text-[var(--color-gold)]" aria-label="Completed" />
                    ) : locked ? (
                      <Lock className="h-5 w-5 flex-none text-black/30 dark:text-white/30" aria-label="Not open to you yet" />
                    ) : (
                      <ArrowRight className="h-5 w-5 flex-none text-[var(--color-burgundy)] transition-transform group-hover:translate-x-1" aria-hidden />
                    )}
                  </div>
                  <div className="mt-5">
                    {e ? (
                      <>
                        <div className="mb-2 flex justify-between text-sm text-black/60 dark:text-white/60">
                          <span>
                            {e.status === "WAITING" ? "Registered, opens soon" : e.status === "COMPLETED" ? `Completed ${formatDate(e.completedAt)}` : `${e.completedLessons} of ${c.totalLessons} lessons`}
                          </span>
                          <span>{e.progressPct}%</span>
                        </div>
                        <ProgressBar pct={e.progressPct} label={`${c.title} progress`} />
                      </>
                    ) : (
                      <p className="text-sm text-black/60 dark:text-white/60">
                        {locked
                          ? c.requiresFullMembership && data.membershipStatus !== "FULL"
                            ? "For full members."
                            : "Opens after the class before it."
                          : c.eligibility.eligible
                            ? `${c.duration}. You can start now.`
                            : `${c.eligibility.attended} of ${c.eligibility.required} Sundays attended.`}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {facilitating && facilitating.length > 0 && (
        <section className="mt-12">
          <h2 className="cls-display text-2xl text-[var(--color-ink)] dark:text-white">Cohorts you facilitate</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {facilitating.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/classes/facilitate/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--color-pink-border)] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <span>
                    <span className="block font-semibold text-[var(--color-ink)] dark:text-white">{c.Course.title}: {c.name}</span>
                    <span className="block text-sm text-black/60 dark:text-white/60">Starts {formatDate(c.startsOn)}</span>
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
