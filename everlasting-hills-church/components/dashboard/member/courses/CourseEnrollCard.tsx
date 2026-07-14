import Link from "next/link";
import { CheckCircle2, Clock, GraduationCap, PlayCircle, Users } from "lucide-react";
import type { Course } from "@/lib/courses-data";

export default function CourseEnrollCard({
  course,
  enrolled,
  enrolling,
  onEnroll,
}: {
  course: Course;
  enrolled: boolean;
  enrolling: boolean;
  onEnroll: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] overflow-hidden">
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 text-gray-500 dark:text-white/50">
            <Clock size={14} /> Duration
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">{course.duration}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 text-gray-500 dark:text-white/50">
            <PlayCircle size={14} /> Lessons
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">{course.lessonsCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 text-gray-500 dark:text-white/50">
            <Users size={14} /> Enrolled
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">{course.studentsCount} members</span>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-white/8 p-5">
        {enrolled ? (
          <Link
            href="/dashboard/courses"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <CheckCircle2 size={16} /> Continue Learning
          </Link>
        ) : (
          <button
            type="button"
            onClick={onEnroll}
            disabled={enrolling}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-60"
          >
            <GraduationCap size={16} /> {enrolling ? "Enrolling…" : "Take This Course"}
          </button>
        )}
        <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-white/40">
          Free for all church members · Learn at your own pace
        </p>
      </div>

      <div className="border-t border-gray-100 dark:border-white/8 p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">Instructor</p>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 text-sm font-bold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a]">
            {course.instructor.name[0]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{course.instructor.name}</p>
            <p className="truncate text-xs text-gray-400 dark:text-white/40">{course.instructor.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
