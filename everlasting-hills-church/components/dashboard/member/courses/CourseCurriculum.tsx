"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Lock, PlayCircle, ShieldQuestion } from "lucide-react";
import { getModuleWatchStatus, isLessonUnlocked, type CourseModule } from "@/lib/api/courses";

const MODULE_BADGE: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "in-progress": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export default function CourseCurriculum({
  modules,
  slug,
  watchedLessonIds = [],
  passedModuleIds = [],
  interactive = true,
}: {
  modules: CourseModule[];
  /** Course slug — required to link lessons to the watch page when interactive. */
  slug?: string;
  /** Lesson ids the member has watched to completion — drives the module badges. */
  watchedLessonIds?: string[];
  /** Module ids whose checkpoint question has been passed. */
  passedModuleIds?: string[];
  /** Explore Courses shows the syllabus read-only; My Courses lets you actually watch. */
  interactive?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] overflow-hidden">
      <div className="border-b border-gray-100 dark:border-white/8 p-5">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Curriculum</h2>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {modules.map((mod, i) => {
          const open = openIndex === i;
          const moduleStatus = interactive ? getModuleWatchStatus(mod, watchedLessonIds) : "not-started";
          const checkVideoIds = mod.lessons.filter((l) => l.videoUrl).map((l) => l.id);
          const checkModuleWatched = checkVideoIds.length === 0 || checkVideoIds.every((id) => watchedLessonIds.includes(id));
          const checkPassed = passedModuleIds.includes(mod.id);
          const showCheckpoint = interactive && !!slug && !!mod.check;
          return (
            <div key={mod.title}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? -1 : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-2.5">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{mod.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">{mod.lessons.length} lessons</p>
                  </div>
                  {moduleStatus !== "not-started" && (
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${MODULE_BADGE[moduleStatus]}`}>
                      {moduleStatus === "completed" ? "Watched" : "In progress"}
                    </span>
                  )}
                </div>
                <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>

              {open && (
                <ul className="space-y-1 px-5 pb-4">
                  {mod.lessons.map((lesson, li) => {
                    const watched = watchedLessonIds.includes(lesson.id);
                    const unlocked =
                      watched || isLessonUnlocked({ curriculum: modules }, lesson.id, watchedLessonIds, passedModuleIds);
                    const watchable = interactive && !!lesson.videoUrl && !!slug && unlocked;
                    const locked = interactive && !!lesson.videoUrl && !!slug && !unlocked;
                    const rowCls =
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-600 dark:text-white/60";
                    const inner = (
                      <>
                        <span className="flex min-w-0 items-center gap-2.5">
                          {watched ? (
                            <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-500" />
                          ) : locked ? (
                            <Lock size={13} className="flex-shrink-0 text-gray-300 dark:text-white/20" />
                          ) : (
                            <PlayCircle
                              size={14}
                              className={`flex-shrink-0 ${watchable ? "text-[#87102C] dark:text-[#e8768a]" : "text-gray-300 dark:text-white/20"}`}
                            />
                          )}
                          <span className={`truncate ${locked ? "text-gray-400 dark:text-white/30" : ""}`}>{lesson.title}</span>
                        </span>
                        <span className="flex-shrink-0 text-xs text-gray-400 dark:text-white/40">{lesson.duration}</span>
                      </>
                    );

                    return (
                      <li key={lesson.title}>
                        {watchable ? (
                          <Link href={`/dashboard/courses/${slug}/watch/${i}-${li}`} className={`${rowCls} hover:bg-gray-50 dark:hover:bg-white/[0.03]`}>
                            {inner}
                          </Link>
                        ) : (
                          <div className={`${rowCls} ${locked ? "cursor-not-allowed" : ""}`} title={locked ? "Complete the previous lesson to unlock" : undefined}>
                            {inner}
                          </div>
                        )}
                      </li>
                    );
                  })}

                  {showCheckpoint && (
                    <li>
                      {checkPassed ? (
                        <div className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={14} className="flex-shrink-0" />
                          <span className="truncate font-semibold">Checkpoint passed</span>
                        </div>
                      ) : checkModuleWatched ? (
                        <Link
                          href={`/dashboard/courses/${slug}/module/${mod.id}/check`}
                          className="flex w-full items-center gap-2.5 rounded-lg bg-[#87102C]/5 px-3 py-2.5 text-left text-sm font-semibold text-[#87102C] hover:bg-[#87102C]/10 dark:bg-[#87102C]/15 dark:text-[#e8768a] dark:hover:bg-[#87102C]/25 transition-colors"
                        >
                          <ShieldQuestion size={14} className="flex-shrink-0" />
                          <span className="truncate">Answer checkpoint question</span>
                        </Link>
                      ) : (
                        <div
                          className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-gray-400 dark:text-white/30"
                          title="Watch every lesson in this module first"
                        >
                          <Lock size={13} className="flex-shrink-0" />
                          <span className="truncate">Checkpoint question</span>
                        </div>
                      )}
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
