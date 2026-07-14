"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, GraduationCap, RotateCcw, XCircle } from "lucide-react";
import { getCatalog, getCourseBySlug } from "@/lib/courses-catalog";
import { getCourseStatus, recordExamAttempt } from "@/lib/courses-store";
import { useCourseProgress } from "@/hooks";

export default function CourseExamClient({ slug }: { slug: string }) {
  const router = useRouter();
  const catalog = useMemo(getCatalog, []);
  const course = getCourseBySlug(slug);
  const { progress, refresh } = useCourseProgress();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ scorePct: number; correct: number; total: number } | null>(null);

  if (!course) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <GraduationCap size={28} className="text-gray-300 dark:text-gray-700" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">This course couldn't be found.</p>
      </div>
    );
  }

  const status = getCourseStatus(course, catalog, progress);
  const backHref = `/dashboard/explore-courses/${course.slug}`;

  if (status === "locked") {
    return (
      <div className="max-w-2xl space-y-4">
        <BackLink href={backHref} label={course.title} />
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 dark:border-white/10 p-16 text-center">
          <GraduationCap size={28} className="text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Complete the prerequisite course first to unlock this exam.
          </p>
        </div>
      </div>
    );
  }

  if (course.exam.length === 0) {
    return (
      <div className="max-w-2xl space-y-4">
        <BackLink href={backHref} label={course.title} />
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 dark:border-white/10 p-16 text-center">
          <GraduationCap size={28} className="text-gray-300 dark:text-gray-700" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            No exam has been set up for this course yet.
          </p>
        </div>
      </div>
    );
  }

  const allAnswered = course.exam.every((q) => answers[q.id] !== undefined);

  function submit() {
    if (!course || !allAnswered) return;
    const correct = course.exam.filter((q) => answers[q.id] === q.correctIndex).length;
    const scorePct = Math.round((correct / course.exam.length) * 100);
    recordExamAttempt(course.id, scorePct);
    refresh();
    setResult({ scorePct, correct, total: course.exam.length });
  }

  function retake() {
    setAnswers({});
    setResult(null);
  }

  return (
    <div className="max-w-2xl space-y-5">
      <BackLink href={backHref} label={course.title} />

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
          {course.title} — Exam
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
          Score 100% to complete this course
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
          {course.exam.length} question{course.exam.length === 1 ? "" : "s"} · every answer must be correct to pass.
        </p>
      </div>

      {result && <ResultBanner result={result} onRetake={retake} nextHref={backHref} />}

      <div className="space-y-4">
        {course.exam.map((q, i) => {
          const selected = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
              <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = selected === oi;
                  const showFeedback = !!result;
                  const isCorrectOpt = oi === q.correctIndex;
                  const tone = !showFeedback
                    ? isSelected
                      ? "border-[#87102C] bg-[#87102C]/5 dark:bg-[#87102C]/10"
                      : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                    : isCorrectOpt
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                      : isSelected
                        ? "border-red-400 bg-red-50 dark:bg-red-500/10"
                        : "border-gray-200 dark:border-white/10";

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={!!result}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm text-gray-700 dark:text-white/70 transition-colors ${tone} disabled:cursor-default`}
                    >
                      <span>{opt}</span>
                      {showFeedback && isCorrectOpt && <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600" />}
                      {showFeedback && isSelected && !isCorrectOpt && <XCircle size={15} className="flex-shrink-0 text-red-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!result && (
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit Exam
        </button>
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

function ResultBanner({
  result,
  onRetake,
  nextHref,
}: {
  result: { scorePct: number; correct: number; total: number };
  onRetake: () => void;
  nextHref: string;
}) {
  const passed = result.scorePct === 100;

  return (
    <div
      className={`rounded-2xl p-5 ${passed ? "bg-emerald-600 text-white" : "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"}`}
    >
      <div className="flex items-center gap-3">
        {passed ? <CheckCircle2 size={24} /> : <XCircle size={24} className="text-amber-600 dark:text-amber-400" />}
        <div>
          <p className={`text-base font-bold ${passed ? "text-white" : "text-amber-800 dark:text-amber-300"}`}>
            {passed ? "You passed! 🎉" : `You scored ${result.scorePct}%`}
          </p>
          <p className={`text-sm ${passed ? "text-white/80" : "text-amber-700 dark:text-amber-400/80"}`}>
            {passed
              ? `${result.correct}/${result.total} correct — course completed, next courses unlocked.`
              : `${result.correct}/${result.total} correct — you need 100% to pass. Review and try again.`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {passed ? (
          <a
            href={nextHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25 transition-colors"
          >
            Back to Course
          </a>
        ) : (
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 transition-colors"
          >
            <RotateCcw size={14} /> Retake Exam
          </button>
        )}
      </div>
    </div>
  );
}
