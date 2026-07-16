import Link from "next/link";
import { CheckCircle2, Clock, GraduationCap, Lock, PlayCircle, Users } from "lucide-react";
import type { CourseDetail, CourseProgress, CourseStatus } from "@/lib/api/courses";

export default function CourseEnrollCard({
  course,
  status,
  progress,
  prerequisiteTitle,
  enrolling,
  onEnroll,
}: {
  course: CourseDetail;
  status: CourseStatus;
  progress: CourseProgress | undefined;
  prerequisiteTitle?: string;
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
        {course.exam.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 text-gray-500 dark:text-white/50">
              <CheckCircle2 size={14} /> Pass mark
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">100%</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-white/8 p-5">
        {status === "locked" ? (
          <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 text-center">
            <Lock size={18} className="mx-auto mb-2 text-gray-400 dark:text-white/40" />
            <p className="text-xs font-semibold text-gray-600 dark:text-white/60">
              Complete {prerequisiteTitle ? `"${prerequisiteTitle}"` : "the prerequisite course"} first
            </p>
            {prerequisiteTitle && (
              <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                Score 100% on its exam to unlock this course.
              </p>
            )}
          </div>
        ) : status === "completed" ? (
          <>
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600/10 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={16} /> Course Completed
            </div>
            <Link
              href={`/dashboard/courses/${course.slug}`}
              className="mt-2 block text-center text-xs font-semibold text-gray-400 hover:text-[#87102C] dark:hover:text-[#e8768a]"
            >
              View in My Courses
            </Link>
          </>
        ) : status === "enrolled" ? (
          <>
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600/10 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={16} /> You're Enrolled
            </div>
            <Link
              href={`/dashboard/courses/${course.slug}`}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24]"
            >
              <GraduationCap size={16} /> Go to My Courses
            </Link>
            {progress?.lastScorePct != null && (
              <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-white/40">
                Last attempt: {progress.lastScorePct}% — score 100% to complete this course.
              </p>
            )}
          </>
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
        {status === "available" && (
          <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-white/40">
            Free for all church members · Learn at your own pace
          </p>
        )}
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
