"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, RotateCcw, ShieldQuestion, XCircle } from "lucide-react";
import {
  useCourse,
  useMyCourseProgress,
  useSubmitModuleCheck,
  type ModuleCheckResult,
} from "@/lib/api/courses";
import CourseExamSkeleton from "@/components/ui/skeleton/CourseExamSkeleton";

/** Where "Continue" should go after passing — the next module's first video lesson, or back to the course if this was the last module (or it has no video lessons). */
function nextHrefAfterModule(course: { slug: string; curriculum: { id: string; lessons: { videoUrl: string | null }[] }[] }, moduleId: string) {
  const idx = course.curriculum.findIndex((m) => m.id === moduleId);
  for (let i = idx + 1; i < course.curriculum.length; i++) {
    const li = course.curriculum[i].lessons.findIndex((l) => l.videoUrl);
    if (li !== -1) return `/dashboard/courses/${course.slug}/watch/${i}-${li}`;
  }
  return `/dashboard/courses/${course.slug}`;
}

export default function ModuleCheckClient({ slug, moduleId }: { slug: string; moduleId: string }) {
  const { data: course, isLoading } = useCourse(slug);
  const { data: progress = {} } = useMyCourseProgress();
  const submitCheck = useSubmitModuleCheck(course?.id ?? "", moduleId);

  const [answer, setAnswer] = useState<number | undefined>();
  const [result, setResult] = useState<ModuleCheckResult | null>(null);

  if (isLoading) return <CourseExamSkeleton />;

  if (!course) {
    return <Empty backHref="/dashboard/courses" label="This course couldn't be found." />;
  }

  const backHref = `/dashboard/courses/${course.slug}`;
  const mod = course.curriculum.find((m) => m.id === moduleId);

  if (!mod || !mod.check) {
    return <Empty backHref={backHref} label="This module has no checkpoint question." courseTitle={course.title} />;
  }

  const courseProgress = progress[course.id];
  const videoLessonIds = mod.lessons.filter((l) => l.videoUrl).map((l) => l.id);
  const watchedLessonIds = courseProgress?.watchedLessonIds ?? [];
  const allWatched = videoLessonIds.length === 0 || videoLessonIds.every((id) => watchedLessonIds.includes(id));

  if (!allWatched) {
    return (
      <Empty
        backHref={backHref}
        label="Watch every lesson in this module first to unlock its checkpoint question."
        courseTitle={course.title}
      />
    );
  }

  const alreadyPassed = (courseProgress?.passedModuleIds ?? []).includes(moduleId);
  const nextHref = nextHrefAfterModule(course, moduleId);

  function submit() {
    if (answer === undefined) return;
    submitCheck.mutate(answer, { onSuccess: setResult });
  }

  function retry() {
    setAnswer(undefined);
    setResult(null);
  }

  const passed = alreadyPassed || result?.correct;

  return (
    <div className="max-w-2xl space-y-5">
      <BackLink href={backHref} label={course.title} />

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
          {mod.title} — Checkpoint
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <ShieldQuestion size={20} className="text-[#87102C] dark:text-[#e8768a]" />
          Answer correctly to unlock the next module
        </h1>
      </div>

      {passed ? (
        <div className="rounded-2xl bg-emerald-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} />
            <div>
              <p className="text-base font-bold">Checkpoint passed! 🎉</p>
              <p className="text-sm text-white/80">The next module is now unlocked.</p>
            </div>
          </div>
          <a
            href={nextHref}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25 transition-colors"
          >
            Continue
          </a>
        </div>
      ) : (
        <>
          {result && !result.correct && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-5">
              <div className="flex items-center gap-3">
                <XCircle size={22} className="text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-base font-bold text-amber-800 dark:text-amber-300">Not quite right</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400/80">Review the question and try again.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={retry}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 transition-colors"
              >
                <RotateCcw size={14} /> Try Again
              </button>
            </div>
          )}

          {!result && (
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
              <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">{mod.check.question}</p>
              <div className="space-y-2">
                {mod.check.options.map((opt, oi) => {
                  const isSelected = answer === oi;
                  const tone = isSelected
                    ? "border-[#87102C] bg-[#87102C]/5 dark:bg-[#87102C]/10"
                    : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20";
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setAnswer(oi)}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left text-sm text-gray-700 dark:text-white/70 transition-colors ${tone}`}
                    >
                      {isSelected ? (
                        <CheckCircle2 size={15} className="flex-shrink-0 text-[#87102C] dark:text-[#e8768a]" />
                      ) : (
                        <Circle size={15} className="flex-shrink-0 text-gray-300 dark:text-white/20" />
                      )}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!result && (
            <button
              type="button"
              onClick={submit}
              disabled={answer === undefined || submitCheck.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitCheck.isPending ? "Submitting…" : "Submit Answer"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
    >
      <ArrowLeft size={14} /> {label}
    </a>
  );
}

function Empty({ backHref, label, courseTitle }: { backHref: string; label: string; courseTitle?: string }) {
  return (
    <div className="max-w-2xl space-y-4">
      <BackLink href={backHref} label={courseTitle ?? "Courses"} />
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 dark:border-white/10 p-16 text-center">
        <ShieldQuestion size={28} className="text-gray-300 dark:text-gray-700" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      </div>
    </div>
  );
}
