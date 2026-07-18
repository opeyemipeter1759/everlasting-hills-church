import Link from "next/link";
import { CheckCircle2, Clock, Lock, PlayCircle, Users } from "lucide-react";
import { ICON_OPTIONS } from "@/lib/courses-data";
import type { CourseListItem, CourseStatus } from "@/lib/api/courses";

export default function CourseCard({
  course,
  status,
  prerequisiteTitle,
  href,
  progressPct,
}: {
  course: CourseListItem;
  status: CourseStatus;
  prerequisiteTitle?: string;
  /** Defaults to the Explore Courses detail page; My Courses passes its own detail route. */
  href?: string;
  /** 0–100 — when provided, shows a slim progress bar (My Courses' in-progress cards). */
  progressPct?: number;
}) {
  const Icon = ICON_OPTIONS[course.iconKey] ?? ICON_OPTIONS.BookOpen;
  const [from, to] = course.gradient;
  const locked = status === "locked";

  return (
    <Link
      href={href ?? `/dashboard/explore-courses/${course.slug}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] transition-all hover:shadow-lg hover:-translate-y-0.5 ${locked ? "opacity-75" : ""}`}
    >
      <div
        className="relative flex h-36 items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div aria-hidden="true" className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-black/10 blur-2xl" />

        {locked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 backdrop-blur-[2px]">
            <Lock size={26} className="text-white/90" />
            {prerequisiteTitle && (
              <p className="max-w-[85%] text-center text-[11px] font-semibold text-white/80">
                Complete "{prerequisiteTitle}" first
              </p>
            )}
          </div>
        ) : (
          <Icon size={44} className="relative text-white/85 transition-transform group-hover:scale-110" strokeWidth={1.5} />
        )}

        {status === "completed" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 size={11} /> Completed
          </span>
        )}
        {status === "enrolled" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#87102C]">
            <CheckCircle2 size={11} /> Enrolled
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
          {course.category.name}
        </p>
        <h3 className="mt-1 text-base font-bold text-gray-900 dark:text-white line-clamp-1">{course.title}</h3>
        <p className="mt-1.5 flex-1 text-sm text-gray-500 dark:text-white/50 line-clamp-2">{course.tagline}</p>

        {progressPct !== undefined && (
          <div className="mt-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-white/50">
              <span>Progress</span>
              <span className="tabular-nums text-gray-900 dark:text-white">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-[#87102C] transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 border-t border-gray-100 dark:border-white/[0.06] pt-3 text-xs text-gray-400 dark:text-white/40">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} /> {course.duration}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <PlayCircle size={13} /> {course.lessonsCount} lessons
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} /> {course.studentsCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
