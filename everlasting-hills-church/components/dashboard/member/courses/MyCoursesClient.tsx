"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Award, Compass, Gauge, GraduationCap, type LucideIcon, PlayCircle, TrendingUp } from "lucide-react";
import { ICON_OPTIONS } from "@/lib/courses-data";
import { useCourses, useMyCourseProgress, getCourseStatus, type CourseListItem, type ProgressMap } from "@/lib/api/courses";
import MyCoursesSkeleton from "@/components/ui/skeleton/MyCoursesSkeleton";
import CourseCard from "./CourseCard";

function progressPctFor(course: CourseListItem, progress: ProgressMap): number {
  if (course.lessonsCount === 0) return 0;
  const watched = progress[course.id]?.watchedLessonIds.length ?? 0;
  return Math.min(100, Math.round((watched / course.lessonsCount) * 100));
}

export default function MyCoursesClient() {
  const { data: catalog = [], isLoading: catalogLoading } = useCourses();
  const { data: progress = {}, isLoading: progressLoading } = useMyCourseProgress();

  if (catalogLoading || progressLoading) return <MyCoursesSkeleton />;

  const enrolled = catalog.filter((c) => progress[c.id]?.enrolled);
  const inProgress = enrolled.filter((c) => !progress[c.id]?.completed);
  const completed = enrolled.filter((c) => progress[c.id]?.completed);

  // Surface whichever in-progress course is furthest along as the bento hero tile,
  // so returning members land on their next step instead of a flat list.
  const featured =
    inProgress.length > 0
      ? [...inProgress].sort((a, b) => progressPctFor(b, progress) - progressPctFor(a, progress))[0]
      : null;
  const restInProgress = featured ? inProgress.filter((c) => c.id !== featured.id) : inProgress;
  const avgProgress =
    enrolled.length > 0
      ? Math.round(
          enrolled.reduce((sum, c) => sum + (progress[c.id]?.completed ? 100 : progressPctFor(c, progress)), 0) / enrolled.length,
        )
      : 0;

  return (
    <div className="max-w-6xl space-y-7 sm:space-y-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-1.5 h-9 w-1 flex-shrink-0 rounded-full bg-[#87102C]" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
              My Courses
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Continue learning
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
              Watch lessons and take exams for courses you've enrolled in.
            </p>
          </div>
        </div>
        {enrolled.length > 0 && (
          <Link
            href="/dashboard/explore-courses"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Compass size={15} /> Explore more courses
          </Link>
        )}
      </div>

      {enrolled.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center sm:p-16">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20">
            <GraduationCap size={26} className="text-[#87102C] dark:text-[#e8768a]" />
          </span>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">You haven't enrolled in any courses yet</p>
          <p className="max-w-xs text-xs text-gray-400 dark:text-gray-500">Explore the catalog to find one that fits your season.</p>
          <Link
            href="/dashboard/explore-courses"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] transition-colors"
          >
            <Compass size={15} /> Explore Courses
          </Link>
        </div>
      ) : (
        <>
          {/* Bento block: hero tile fills a 2x2 corner, four single-cell stats pack the
              rest via dense flow — an intentional mixed-size grid rather than a flat
              row of identical cards. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-flow-row-dense lg:grid-cols-4">
            {featured ? (
              <FeaturedTile
                course={featured}
                pct={progressPctFor(featured, progress)}
                className="col-span-2 row-span-2"
              />
            ) : (
              <AllCaughtUpTile className="col-span-2 row-span-2" />
            )}
            <BentoStat tone="neutral" icon={<GraduationCap size={17} />} label="Enrolled" value={enrolled.length} />
            <BentoStat tone="amber" icon={<TrendingUp size={17} />} label="In progress" value={inProgress.length} />
            <BentoStat tone="emerald" icon={<Award size={17} />} label="Completed" value={completed.length} />
            <BentoStat tone="brand" icon={<Gauge size={17} />} label="Avg. progress" value={`${avgProgress}%`} />
          </div>

          {restInProgress.length > 0 && (
            <section className="space-y-3">
              <SectionHeading icon={PlayCircle} label="In Progress" count={restInProgress.length} tone="amber" />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {restInProgress.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    status={getCourseStatus(course, catalog, progress)}
                    href={`/dashboard/courses/${course.slug}`}
                    progressPct={progressPctFor(course, progress)}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-3">
              <SectionHeading icon={Award} label="Completed" count={completed.length} tone="emerald" />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    status={getCourseStatus(course, catalog, progress)}
                    href={`/dashboard/courses/${course.slug}`}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** Circular alternative to a linear progress bar — reads better inside a compact tile. */
function ProgressRing({ pct, size = 64, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${pct}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#fff"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

const STAT_TILE_CLS: Record<"neutral" | "amber" | "emerald" | "brand", string> = {
  neutral: "bg-white dark:bg-[#161618] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white",
  amber: "bg-amber-500 text-white",
  emerald: "bg-emerald-600 text-white",
  brand: "bg-[#87102C] text-white",
};

function BentoStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone: "neutral" | "amber" | "emerald" | "brand";
}) {
  const iconWrap = tone === "neutral" ? "bg-[#87102C]/10 dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#e8768a]" : "bg-white/20 text-white";
  const labelCls = tone === "neutral" ? "text-gray-400 dark:text-gray-500" : "text-white/75";

  return (
    <div className={`flex flex-col justify-between rounded-2xl p-3.5 sm:p-4 ${STAT_TILE_CLS[tone]}`}>
      <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${iconWrap}`}>
        {icon}
      </span>
      <div className="mt-2 sm:mt-3">
        <p className={`text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${labelCls}`}>{label}</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  label,
  count,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  tone: "amber" | "emerald";
}) {
  const dot = tone === "amber" ? "bg-amber-500" : "bg-emerald-600";
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} />
      <Icon size={14} className="text-gray-400 dark:text-white/40" />
      <h2 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-white/70">{label}</h2>
      <span className="rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:text-white/50">
        {count}
      </span>
    </div>
  );
}

function AllCaughtUpTile({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-600 p-6 text-center text-white ${className ?? ""}`}>
      <Award size={30} />
      <p className="text-lg font-bold">You're all caught up!</p>
      <p className="max-w-xs text-sm text-white/80">Every enrolled course is completed — ready for another?</p>
      <Link
        href="/dashboard/explore-courses"
        className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur-sm transition-colors hover:bg-white/25"
      >
        <Compass size={15} /> Explore Courses
      </Link>
    </div>
  );
}

function FeaturedTile({ course, pct, className }: { course: CourseListItem; pct: number; className?: string }) {
  const Icon = ICON_OPTIONS[course.iconKey] ?? ICON_OPTIONS.BookOpen;
  const [from, to] = course.gradient;

  return (
    <Link
      href={`/dashboard/courses/${course.slug}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 text-white transition-all hover:-translate-y-0.5 hover:shadow-xl sm:p-6 ${className ?? ""}`}
      style={{ background: `linear-gradient(150deg, ${from} 0%, ${to} 100%)` }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-black/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Continue learning</p>
          <h3 className="mt-2 text-lg font-bold leading-tight sm:text-2xl">{course.title}</h3>
          <p className="mt-1.5 max-w-xs text-sm text-white/70 line-clamp-2">{course.tagline}</p>
        </div>
        <div className="relative flex-shrink-0">
          <ProgressRing pct={pct} size={60} stroke={5} />
          <Icon size={20} className="absolute inset-0 m-auto text-white" strokeWidth={1.75} />
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between gap-3 sm:mt-8">
        <span className="text-sm font-bold tabular-nums text-white/90">{pct}% complete</span>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold backdrop-blur-sm transition-colors group-hover:bg-white/25">
          Continue <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
