"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, GraduationCap, Loader2, Lock, PlayCircle } from "lucide-react";
import { getModuleWatchStatus, isLessonUnlocked, useCourse, useMarkLessonWatched, useMyCourseProgress } from "@/lib/api/courses";
import YouTubePlayer from "./YouTubePlayer";
import CourseWatchSkeleton from "@/components/ui/skeleton/CourseWatchSkeleton";

interface FlatLesson {
  id: string;
  moduleIndex: number;
  lessonIndex: number;
  moduleTitle: string;
  title: string;
  duration: string;
  videoUrl: string | null;
}

const MODULE_BADGE: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "in-progress": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export default function CourseWatchClient({ slug, lessonParam }: { slug: string; lessonParam: string }) {
  const router = useRouter();
  const { data: course, isLoading: courseLoading } = useCourse(slug);
  const { data: progress = {}, isLoading: progressLoading } = useMyCourseProgress();
  const markWatched = useMarkLessonWatched(course?.id ?? "");

  const [moduleIndex, lessonIndex] = lessonParam.split("-").map(Number);

  const flat: FlatLesson[] = useMemo(() => {
    if (!course) return [];
    return course.curriculum.flatMap((mod, mi) =>
      mod.lessons.map((l, li) => ({
        id: l.id,
        moduleIndex: mi,
        lessonIndex: li,
        moduleTitle: mod.title,
        title: l.title,
        duration: l.duration,
        videoUrl: l.videoUrl,
      })),
    );
  }, [course]);

  if (courseLoading || progressLoading) return <CourseWatchSkeleton />;

  if (!course) return <NotFound label="This course couldn't be found." backHref="/dashboard/courses" />;

  const courseProgress = progress[course.id];
  if (!courseProgress?.enrolled) {
    return <NotFound label="You haven't enrolled in this course yet." backHref={`/dashboard/explore-courses/${slug}`} />;
  }

  const watchedLessonIds = courseProgress.watchedLessonIds;
  const current = flat.find((l) => l.moduleIndex === moduleIndex && l.lessonIndex === lessonIndex);

  if (!current || !current.videoUrl) {
    return <NotFound label="This lesson doesn't have a video." backHref={`/dashboard/courses/${slug}`} />;
  }

  // Route-level guard so a direct link can't skip ahead of the sequential lock —
  // mirrors the sidebar/curriculum lock below.
  if (!watchedLessonIds.includes(current.id) && !isLessonUnlocked(course, current.id, watchedLessonIds)) {
    return <NotFound label="Complete the previous lesson first to unlock this one." backHref={`/dashboard/courses/${slug}`} />;
  }

  const watchable = flat.filter((l) => l.videoUrl);
  const pos = watchable.findIndex((l) => l.moduleIndex === moduleIndex && l.lessonIndex === lessonIndex);
  const prev = pos > 0 ? watchable[pos - 1] : null;
  const nextLesson = pos >= 0 && pos < watchable.length - 1 ? watchable[pos + 1] : null;
  const next = watchedLessonIds.includes(current.id) ? nextLesson : null;

  function hrefFor(l: FlatLesson) {
    return `/dashboard/courses/${slug}/watch/${l.moduleIndex}-${l.lessonIndex}`;
  }

  const currentId = current.id;

  function handleEnded() {
    // Wait for the watch-status mutation (and its cache invalidation) to finish before
    // navigating, so the next lesson's unlock guard sees fresh, not stale, progress.
    markWatched.mutate(currentId, {
      onSuccess: () => {
        if (nextLesson) router.push(hrefFor(nextLesson));
      },
    });
  }

  return (
    <div className="max-w-[1400px] space-y-4">
      <Link
        href={`/dashboard/courses/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} /> {course.title}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
            <YouTubePlayer key={current.id} url={current.videoUrl} onEnded={handleEnded} />
            {markWatched.isPending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
                <Loader2 size={26} className="animate-spin text-white/70" />
                <p className="text-sm font-semibold text-white/70">
                  {nextLesson ? `Loading next lesson: ${nextLesson.title}…` : "Marking lesson complete…"}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
                {current.moduleTitle}
              </p>
              <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{current.title}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/50">{current.duration}</p>
            </div>
            {watchedLessonIds.includes(current.id) && (
              <span className="mt-1 inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={11} /> Watched
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!prev || markWatched.isPending}
              onClick={() => prev && router.push(hrefFor(prev))}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} /> Previous lesson
            </button>
            <button
              type="button"
              disabled={!next || markWatched.isPending}
              onClick={() => next && router.push(hrefFor(next))}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next lesson <ChevronRight size={15} />
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
            <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
              About this course
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-white/60">{course.description}</p>

            {course.outcomes.length > 0 && (
              <>
                <h3 className="mb-3 mt-5 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                  What you'll learn
                </h3>
                <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {course.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-sm text-gray-600 dark:text-white/60">
                      <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Link
              href={`/dashboard/courses/${slug}`}
              className="mt-4 inline-block text-xs font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]"
            >
              View full course & exam →
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] lg:sticky lg:top-6">
          <div className="border-b border-gray-100 dark:border-white/8 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">Course</p>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{course.title}</h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">{watchable.length} videos</p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
            {course.curriculum.map((mod, mi) => {
              const moduleStatus = getModuleWatchStatus(mod, watchedLessonIds);
              return (
                <div key={mod.title}>
                  <div className="sticky top-0 flex items-center justify-between gap-2 bg-gray-50 dark:bg-white/[0.03] px-4 py-2">
                    <p className="truncate text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                      {mod.title}
                    </p>
                    {moduleStatus !== "not-started" && (
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${MODULE_BADGE[moduleStatus]}`}>
                        {moduleStatus === "completed" ? "Watched" : "In progress"}
                      </span>
                    )}
                  </div>
                  {mod.lessons.map((l, li) => {
                    const isCurrent = mi === moduleIndex && li === lessonIndex;
                    const hasVideo = !!l.videoUrl;
                    const watched = watchedLessonIds.includes(l.id);
                    const unlocked = watched || isLessonUnlocked(course, l.id, watchedLessonIds);
                    const locked = hasVideo && !unlocked;
                    const rowCls = `flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm transition-colors ${
                      isCurrent
                        ? "border-[#87102C] bg-[#87102C]/5 dark:bg-[#87102C]/10"
                        : locked
                          ? "border-transparent cursor-not-allowed"
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    }`;
                    const inner = (
                      <>
                        {watched ? (
                          <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-500" />
                        ) : locked ? (
                          <Lock size={13} className="flex-shrink-0 text-gray-300 dark:text-white/20" />
                        ) : (
                          <PlayCircle
                            size={14}
                            className={`flex-shrink-0 ${isCurrent ? "text-[#87102C] dark:text-[#e8768a]" : hasVideo ? "text-gray-400 dark:text-white/40" : "text-gray-200 dark:text-white/15"}`}
                          />
                        )}
                        <span
                          className={`min-w-0 flex-1 truncate ${isCurrent ? "font-semibold text-gray-900 dark:text-white" : locked ? "text-gray-400 dark:text-white/30" : "text-gray-600 dark:text-white/60"}`}
                        >
                          {l.title}
                        </span>
                        <span className="flex-shrink-0 text-xs text-gray-400 dark:text-white/40">{l.duration}</span>
                      </>
                    );
                    return hasVideo && !locked ? (
                      <Link key={l.title} href={`/dashboard/courses/${slug}/watch/${mi}-${li}`} className={rowCls}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={l.title} className={rowCls} title={locked ? "Complete the previous lesson to unlock" : undefined}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound({ label, backHref }: { label: string; backHref: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <GraduationCap size={28} className="text-gray-300 dark:text-gray-700" />
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      <Link href={backHref} className="text-sm font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]">
        ← Go back
      </Link>
    </div>
  );
}
