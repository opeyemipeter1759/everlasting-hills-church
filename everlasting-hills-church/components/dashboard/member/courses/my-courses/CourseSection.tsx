import type { LucideIcon } from "lucide-react";
import { getCourseStatus, type CourseListItem, type ProgressMap } from "@/lib/api/courses";
import CourseCard from "../CourseCard";
import { progressPctFor } from "./course-summary";

/** A labelled group of the member's courses ("In Progress", "Completed") as a card grid. */
export function CourseSection({ icon: Icon, label, tone, courses, catalog, progress, enrolledCategoryIds, showProgress }: {
  icon: LucideIcon;
  label: string;
  tone: "amber" | "emerald";
  courses: CourseListItem[];
  catalog: CourseListItem[];
  progress: ProgressMap;
  enrolledCategoryIds: string[];
  /** Show each card's progress bar (in-progress courses). */
  showProgress?: boolean;
}) {
  if (courses.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${tone === "amber" ? "bg-amber-500" : "bg-emerald-600"}`} />
        <Icon size={14} className="text-gray-400 dark:text-white/40" />
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-white/70">{label}</h2>
        <span className="rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:text-white/50">
          {courses.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            status={getCourseStatus(course, catalog, progress, enrolledCategoryIds)}
            href={`/dashboard/courses/${course.slug}`}
            progressPct={showProgress ? progressPctFor(course, progress) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
