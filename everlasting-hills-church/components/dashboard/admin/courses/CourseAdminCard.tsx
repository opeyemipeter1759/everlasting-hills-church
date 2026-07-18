import { ArrowUpRight, Clock, Lock, PlayCircle, Users } from "lucide-react";
import { ICON_OPTIONS } from "@/lib/courses-data";
import type { CourseListItem } from "@/lib/api/courses";

export default function CourseAdminCard({
  course,
  prerequisiteTitle,
  onClick,
}: {
  course: CourseListItem;
  prerequisiteTitle?: string;
  onClick: () => void;
}) {
  const Icon = ICON_OPTIONS[course.iconKey] ?? ICON_OPTIONS.BookOpen;
  const [from, to] = course.gradient;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40"
    >
      <div
        className="relative flex h-32 items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div aria-hidden="true" className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-black/10 blur-2xl" />
        <Icon
          size={38}
          className="relative text-white/85 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
          strokeWidth={1.5}
        />

        <span className="absolute right-3 top-3 flex h-7 w-7 -translate-y-1.5 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight size={14} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
          {course.category.name}
        </p>
        <h3 className="mt-1 text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{course.title}</h3>
        <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-500 dark:text-white/50 line-clamp-2">
          {course.tagline}
        </p>

        {prerequisiteTitle && (
          <p className="mt-2.5 inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            <Lock size={10} /> requires {prerequisiteTitle}
          </p>
        )}

        <div className="mt-3.5 flex items-center gap-3 border-t border-gray-100 dark:border-white/[0.06] pt-3 text-[11px] font-medium text-gray-400 dark:text-white/40">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {course.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle size={12} /> {course.lessonsCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={12} /> {course.studentsCount}
          </span>
        </div>
      </div>
    </button>
  );
}
