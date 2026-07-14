import Link from "next/link";
import { CheckCircle2, Clock, GraduationCap, Lock, PlayCircle, RotateCcw } from "lucide-react";
import { getVideoLessonIds, hasWatchedAllVideos, type CourseDetail, type CourseProgress } from "@/lib/api/courses";

export default function CourseLearnSidebar({
  course,
  progress,
}: {
  course: CourseDetail;
  progress: CourseProgress | undefined;
}) {
  const completed = !!progress?.completed;
  const watchedLessonIds = progress?.watchedLessonIds ?? [];
  const videoLessonIds = getVideoLessonIds(course);
  const watchedCount = videoLessonIds.filter((id) => watchedLessonIds.includes(id)).length;
  // No videos to gate on (text-only curriculum) — don't block the exam on something
  // that can't be watched.
  const examUnlocked = videoLessonIds.length === 0 || hasWatchedAllVideos(course, watchedLessonIds);

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
        {videoLessonIds.length > 0 && !completed && (
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 text-gray-500 dark:text-white/50">
              <CheckCircle2 size={14} /> Watched
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {watchedCount}/{videoLessonIds.length}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-white/8 p-5">
        {completed ? (
          <>
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600/10 px-4 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={16} /> Course Completed
            </div>
            {course.exam.length > 0 && (
              <Link
                href={`/dashboard/courses/${course.slug}/exam`}
                className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#87102C] dark:hover:text-[#e8768a]"
              >
                <RotateCcw size={12} /> Retake exam
              </Link>
            )}
          </>
        ) : course.exam.length === 0 ? (
          <p className="text-center text-xs text-gray-400 dark:text-white/40">
            No exam has been set up for this course yet — work through the lessons at your own pace.
          </p>
        ) : examUnlocked ? (
          <>
            <Link
              href={`/dashboard/courses/${course.slug}/exam`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24]"
            >
              <GraduationCap size={16} /> Take the Exam
            </Link>
            {progress?.lastScorePct != null && (
              <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-white/40">
                Last attempt: {progress.lastScorePct}% — score 100% to complete this course.
              </p>
            )}
          </>
        ) : (
          <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 text-center">
            <Lock size={18} className="mx-auto mb-2 text-gray-400 dark:text-white/40" />
            <p className="text-xs font-semibold text-gray-600 dark:text-white/60">Watch all lessons to unlock the exam</p>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
              {watchedCount}/{videoLessonIds.length} watched so far
            </p>
          </div>
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
