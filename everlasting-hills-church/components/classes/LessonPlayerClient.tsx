"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, PlayCircle, X } from "lucide-react";
import {
  useLesson,
  useSaveSummary,
  useStartWatch,
  useSubmitQuiz,
  useWatchHeartbeat,
  type LessonView,
  type QuizResult,
} from "@/lib/api/classes";
import { SUMMARY_MAX_CHARS, SUMMARY_MIN_CHARS, normalizeSummary, summaryProblem } from "@/lib/classes/summary-rules";
import { showToast } from "@/components/ui/toast/toast";
import { ClassTheme } from "./theme";
import { ClassError, ClassLoading, ProgressBar, errorText, youTubeId } from "./shared";
import LessonVideo from "./LessonVideo";

export default function LessonPlayerClient({ slug, lesson }: { slug: string; lesson: string }) {
  const { data, isLoading, error, refetch } = useLesson(slug, lesson);
  if (isLoading) return <ClassTheme><ClassLoading /></ClassTheme>;
  if (error || !data) {
    return (
      <ClassTheme className="px-4 py-10">
        <ClassError error={error} onRetry={() => refetch()} />
        <p className="mt-6 text-center">
          <Link href={`/dashboard/classes/${slug}`} className="cls-btn cls-btn-outline">Back to the class</Link>
        </p>
      </ClassTheme>
    );
  }
  return <LessonView view={data} slug={slug} lessonRef={lesson} />;
}

const card =
  "rounded-[20px] border border-[var(--color-pink-border)] bg-white dark:border-white/10 dark:bg-white/[0.04]";
const ink = "text-[var(--color-ink)] dark:text-white";

/** One part of the lesson: a serif title, a done mark once it is finished, then its content. */
function Part({
  id,
  title,
  hint,
  done,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`${card} scroll-mt-24 p-5 sm:p-7`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={`cls-display text-2xl sm:text-[28px] ${ink}`}>{title}</h2>
          {hint && <p className="mt-1 text-sm text-black/55 dark:text-white/55">{hint}</p>}
        </div>
        {done && (
          <span className="cls-chip flex-none">
            <Check className="h-3.5 w-3.5" aria-hidden /> Done
          </span>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function LessonView({ view, slug, lessonRef }: { view: LessonView; slug: string; lessonRef: string }) {
  const { lesson, progress } = view;
  const watch = view.watch ?? { required: !!lesson.videoUrl, ready: false, durationSeconds: null, maxPosition: 0, watchedSeconds: 0, watched: false };
  const base = `/dashboard/classes/${slug}`;
  const startWatch = useStartWatch(slug, lessonRef);
  const heartbeat = useWatchHeartbeat(slug, lessonRef);
  const saveSummary = useSaveSummary(slug, lessonRef);
  const sessionId = useRef<string | null>(null);
  /** Opens a sitting with the server. Heartbeats go to it; it is reopened if the server says it is gone. */
  async function openSession(position: number) {
    try {
      const r = await startWatch.mutateAsync(position);
      sessionId.current = r.sessionId;
    } catch (err) {
      sessionId.current = null;
      showToast.error(errorText(err));
    }
  }
  async function report(position: number, maxWatched: number) {
    if (!sessionId.current) await openSession(position);
    if (!sessionId.current) return;
    try {
      await heartbeat.mutateAsync({ sessionId: sessionId.current, position, maxWatched });
    } catch {
      // The sitting was closed or refused: the next report opens a new one.
      sessionId.current = null;
    }
  }
  const videoId = youTubeId(lesson.videoUrl);
  const [playerFailed, setPlayerFailed] = useState(false);
  const summaryLocked = watch.required && !progress.videoDone;

  // The summary is kept on this device as it is written, so a dropped connection never loses it.
  const draftKey = `ehc-summary-draft:${lesson.id}`;
  const [reflection, setReflection] = useState(progress.reflection);
  useEffect(() => {
    if (progress.reflection) {
      setReflection(progress.reflection);
      return;
    }
    try {
      const draft = window.localStorage.getItem(draftKey);
      if (draft) setReflection(draft);
    } catch {
      /* private mode or storage blocked: the page works without it */
    }
  }, [progress.reflection, draftKey]);
  const normalizedLength = normalizeSummary(reflection).length;
  const summaryOk = summaryProblem(reflection) === null;
  function onSummaryChange(value: string) {
    setReflection(value);
    try {
      window.localStorage.setItem(draftKey, value);
    } catch {
      /* ignore */
    }
  }

  const celebrate = (completed: boolean) => {
    if (completed && !progress.completed) showToast.success("Lesson complete. Well done.");
  };

  async function run<T extends { completed: boolean }>(p: Promise<T>, ok?: string) {
    try {
      const r = await p;
      if (ok) showToast.success(ok);
      celebrate(r.completed);
    } catch (err) {
      showToast.error(errorText(err));
    }
  }

  // What this lesson asks of the learner, in the order it is laid out.
  const steps = [
    lesson.videoUrl && { id: "watch", label: "Watch the video", done: progress.videoDone },
    { id: "summary", label: "Write your summary", done: !!progress.reflection },
    lesson.quiz.length > 0 && { id: "quiz", label: "Pass the quiz", done: progress.quizPassed },
  ].filter(Boolean) as { id: string; label: string; done: boolean }[];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = progress.completed ? 100 : steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <ClassTheme className="mx-auto max-w-[1160px] px-1 pb-16 sm:px-4">
      <Link
        href={base}
        className={`inline-flex items-center gap-1.5 rounded text-sm text-black/60 hover:text-[var(--color-burgundy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)] dark:text-white/60 dark:hover:text-white`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {view.class.title}
      </Link>

      <header className="cls-reveal mt-6 max-w-3xl">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">
          <span className="rounded-lg bg-[var(--color-chip)] px-2 py-0.5 font-semibold tabular-nums dark:bg-white/10">
            {lesson.week}.{lesson.number}
          </span>
          <span>
            Week {lesson.week}
            {lesson.weekTitle ? `: ${lesson.weekTitle}` : ""}
          </span>
        </p>
        <h1 className={`cls-display mt-3 text-4xl sm:text-5xl ${ink}`}>{lesson.title}</h1>
        {lesson.description && <p className="mt-3 text-lg text-black/65 dark:text-white/65">{lesson.description}</p>}
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        {/* Progress: a strip above the lesson on phones, pinned beside it on desktop */}
        <aside className="lg:order-last">
          <div className={`${card} p-5 lg:sticky lg:top-24`}>
            <div className="flex items-baseline justify-between">
              <p className={`cls-display text-xl ${ink}`}>{progress.completed ? "Lesson complete" : "Your progress"}</p>
              <p className="text-sm tabular-nums text-black/55 dark:text-white/55">{pct}%</p>
            </div>
            <div className="mt-3">
              <ProgressBar pct={pct} label="Lesson progress" />
            </div>
            {steps.length > 0 && (
              <ol className="mt-5 space-y-1">
                {steps.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex items-center gap-3 rounded-lg px-1 py-1.5 text-[15px] hover:bg-[var(--color-blush)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)] dark:hover:bg-white/[0.06]"
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border ${
                          s.done
                            ? "border-[var(--color-burgundy)] bg-[var(--color-burgundy)] text-white"
                            : "border-[var(--color-pink-border)] dark:border-white/25"
                        }`}
                      >
                        {s.done && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className={s.done ? "text-black/50 line-through decoration-black/20 dark:text-white/45" : ink}>{s.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            )}
            {view.next && (
              <p className="mt-5 flex items-start gap-2 border-t border-[var(--color-pink-border)] pt-4 text-sm text-black/60 dark:border-white/10 dark:text-white/60">
                {progress.completed ? (
                  <ArrowRight className="mt-0.5 h-4 w-4 flex-none text-[var(--color-burgundy)] dark:text-[var(--color-gold)]" aria-hidden />
                ) : (
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 flex-none rounded-full border border-current" />
                )}
                <span>
                  {progress.completed ? "Up next: " : "Finish this lesson to open "}
                  <span className={progress.completed ? `font-semibold ${ink}` : "font-semibold"}>{view.next.title}</span>
                </span>
              </p>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {watch.required && (
            <section id="watch" className="cls-glow cls-on-ink scroll-mt-24 rounded-[24px] p-2 sm:p-3">
              {videoId && watch.ready && !playerFailed ? (
                <LessonVideo
                  videoId={videoId}
                  title={lesson.title}
                  durationHint={watch.durationSeconds}
                  watched={progress.videoDone}
                  resumeAt={watch.maxPosition}
                  onStart={(position) => void openSession(position)}
                  onBeat={(position, maxWatched) => void report(position, maxWatched)}
                  onUnavailable={() => setPlayerFailed(true)}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-[18px] bg-black/40 px-6 text-center text-white/75">
                  {watch.ready ? "This video cannot be played here. Please tell the church office." : "The video for this lesson is not ready yet. Please check back soon."}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4">
                <p className="text-sm text-white/65">
                  Recorded class, {lesson.duration}.{" "}
                  {!progress.videoDone && watch.ready && !playerFailed ? "Watch to the end. You can go back, but not skip ahead." : ""}
                </p>
                {progress.videoDone && (
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-gold)]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> You have watched this
                  </span>
                )}
              </div>
            </section>
          )}

          {lesson.outcome && (
            <div className="rounded-[20px] border-l-4 border-[var(--color-burgundy)] bg-[var(--color-blush)] p-5 sm:p-7 dark:bg-white/[0.06]">
              <p className="text-sm font-semibold text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">By the end, you can</p>
              <p className={`cls-display mt-2 text-2xl !leading-snug sm:text-[28px] ${ink}`}>{lesson.outcome}</p>
            </div>
          )}

          {lesson.summary && (
            <Part id="about" title="In this lesson">
              <p className="whitespace-pre-line text-[17px] leading-[1.7] text-black/75 dark:text-white/80">{lesson.summary}</p>
            </Part>
          )}

          {lesson.scriptures.length > 0 && (
            <Part id="scriptures" title="Key scriptures">
              <ul className="grid gap-4 sm:grid-cols-2">
                {lesson.scriptures.map((s) => (
                  <li key={s.ref} className="border-l-2 border-[var(--color-gold)] pl-4">
                    <p className="text-sm font-semibold text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">{s.ref}</p>
                    {s.text && <p className="cls-display mt-1 text-lg italic !leading-snug text-black/75 dark:text-white/80">{s.text}</p>}
                  </li>
                ))}
              </ul>
            </Part>
          )}

          <Part
            id="summary"
            title="Your summary"
            hint={
              summaryLocked
                ? "Your summary opens when the video ends."
                : `Write a short summary of what you learnt, at least ${SUMMARY_MIN_CHARS} characters. Only you can see it.`
            }
            done={!!progress.reflection}
          >
            <label htmlFor="reflection" className={`cls-display block text-xl !leading-snug ${ink}`}>
              {lesson.summaryPrompt}
            </label>
            <textarea
              id="reflection"
              value={reflection}
              onChange={(e) => onSummaryChange(e.target.value)}
              rows={8}
              maxLength={SUMMARY_MAX_CHARS + 500}
              disabled={summaryLocked}
              placeholder={summaryLocked ? "Watch the video to the end to unlock this." : "In your own words..."}
              className="mt-4 w-full rounded-[14px] border border-[var(--color-pink-border)] bg-white p-4 text-base leading-relaxed text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-burgundy)]/40 disabled:cursor-not-allowed disabled:bg-[var(--color-blush)] dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:disabled:bg-white/[0.02]"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs tabular-nums text-black/50 dark:text-white/50" aria-live="polite">
                {normalizedLength >= SUMMARY_MIN_CHARS ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[var(--color-gold)]" aria-hidden /> {normalizedLength} characters
                  </>
                ) : (
                  <>
                    {normalizedLength} of {SUMMARY_MIN_CHARS}
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const r = await saveSummary.mutateAsync(reflection.trim());
                    showToast.success("Summary saved");
                    try {
                      window.localStorage.removeItem(draftKey);
                    } catch {
                      /* ignore */
                    }
                    celebrate(r.completed);
                  } catch (err) {
                    showToast.error(errorText(err));
                  }
                }}
                disabled={summaryLocked || saveSummary.isPending || !summaryOk || reflection.trim() === progress.reflection}
                className="cls-btn cls-btn-primary !px-5 !py-2.5 !text-sm"
              >
                {saveSummary.isPending ? "Saving..." : "Save summary"}
              </button>
            </div>
          </Part>

          {lesson.quiz.length > 0 && <QuizBlock view={view} slug={slug} lessonRef={lessonRef} onCompleted={celebrate} />}

          <nav className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between" aria-label="Lessons">
            {view.previous ? (
              <Link href={`${base}/${view.previous.week}/${view.previous.slug}`} className="cls-btn cls-btn-outline">
                <ArrowLeft className="h-4 w-4" aria-hidden /> {view.previous.title}
              </Link>
            ) : (
              <span />
            )}
            {view.next ? (
              progress.completed ? (
                <Link href={`${base}/${view.next.week}/${view.next.slug}`} className="cls-btn cls-btn-primary">
                  {view.next.title} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <span className="rounded-full bg-black/[0.04] px-3 py-1 text-sm text-black/55 dark:bg-white/10 dark:text-white/60">
                  The next lesson opens when this one is complete
                </span>
              )
            ) : (
              progress.completed && (
                <Link href={base} className="cls-btn cls-btn-primary">
                  Back to the class <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </ClassTheme>
  );
}

function QuizBlock({
  view,
  slug,
  lessonRef,
  onCompleted,
}: {
  view: LessonView;
  slug: string;
  lessonRef: string;
  onCompleted: (completed: boolean) => void;
}) {
  const { quiz } = view.lesson;
  const { progress } = view;
  const submit = useSubmitQuiz(slug, lessonRef);
  const [answers, setAnswers] = useState<(number | null)[]>(() => quiz.map(() => null));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [retaking, setRetaking] = useState(false);
  const showForm = !progress.quizPassed || retaking;
  const answered = answers.filter((a) => a !== null).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await submit.mutateAsync(answers);
      setResult(r);
      setRetaking(false);
      if (r.passed) showToast.success(`You scored ${r.scorePct}%. Passed.`);
      else showToast.error(`You scored ${r.scorePct}%. You need 60% to pass; have another go.`);
      onCompleted(r.completed);
    } catch (err) {
      showToast.error(errorText(err));
    }
  }

  return (
    <Part
      id="quiz"
      title="Quiz"
      hint={`${quiz.length} question${quiz.length === 1 ? "" : "s"}. You need 60% to pass, and you can try again.`}
      done={progress.quizPassed}
    >
      {!showForm ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={ink}>
            Passed with <strong className="tabular-nums">{progress.quizScorePct}%</strong>
            {progress.quizAttempts > 1 ? ` after ${progress.quizAttempts} tries` : ""}.
          </p>
          <button
            type="button"
            onClick={() => {
              setRetaking(true);
              setResult(null);
              setAnswers(quiz.map(() => null));
            }}
            className="cls-btn cls-btn-outline !px-5 !py-2.5 !text-sm"
          >
            Take it again
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-8">
          {quiz.map((q, qi) => {
            const outcome = result?.results[qi];
            return (
              <fieldset key={q.id}>
                <legend className={`font-semibold leading-snug ${ink}`}>
                  <span className="mr-2 tabular-nums text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">{qi + 1}.</span>
                  {q.prompt}
                  {result &&
                    (outcome ? (
                      <Check className="ml-2 inline h-4 w-4 text-green-600" aria-label="Right" />
                    ) : (
                      <X className="ml-2 inline h-4 w-4 text-red-600" aria-label="Not quite" />
                    ))}
                </legend>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, oi) => {
                    const picked = answers[qi] === oi;
                    return (
                      <label
                        key={oi}
                        className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-[var(--color-burgundy)]/40 ${
                          picked
                            ? "border-[var(--color-burgundy)] bg-[var(--color-chip)] dark:bg-white/[0.08]"
                            : "border-[var(--color-pink-border)] hover:bg-[var(--color-blush)] dark:border-white/10 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={picked}
                          onChange={() => {
                            setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)));
                            setResult(null);
                          }}
                          className="accent-[var(--color-burgundy)]"
                        />
                        <span className={ink}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm tabular-nums text-black/50 dark:text-white/50">
              {answered} of {quiz.length} answered
            </p>
            <button type="submit" disabled={submit.isPending || answers.some((a) => a === null)} className="cls-btn cls-btn-primary !px-5 !py-2.5 !text-sm">
              {submit.isPending ? "Checking..." : "Check my answers"}
            </button>
          </div>
        </form>
      )}
    </Part>
  );
}
