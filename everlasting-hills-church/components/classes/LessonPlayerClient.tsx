"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Lock, PlayCircle, X } from "lucide-react";
import {
  useLesson,
  useMarkVideo,
  useSaveReflection,
  useSetAction,
  useSubmitQuiz,
  type LessonView,
  type QuizResult,
} from "@/lib/api/classes";
import { showToast } from "@/components/ui/toast/toast";
import { ClassTheme } from "./theme";
import { ClassError, ClassLoading, errorText, youTubeEmbed } from "./shared";

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

function Block({ title, done, children }: { title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-[var(--color-pink-border)] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="cls-eyebrow text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">{title}</h2>
        {done && (
          <span className="cls-chip">
            <Check className="h-3.5 w-3.5" aria-hidden /> Done
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function LessonView({ view, slug, lessonRef }: { view: LessonView; slug: string; lessonRef: string }) {
  const { lesson, progress } = view;
  const base = `/dashboard/classes/${slug}`;
  const markVideo = useMarkVideo(slug, lessonRef);
  const saveReflection = useSaveReflection(slug, lessonRef);
  const setAction = useSetAction(slug, lessonRef);
  const embed = youTubeEmbed(lesson.videoUrl);

  const [reflection, setReflection] = useState(progress.reflection);
  useEffect(() => setReflection(progress.reflection), [progress.reflection]);

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

  return (
    <ClassTheme className="pb-16">
      <header className="cls-glow cls-on-ink px-4 pb-10 pt-8 sm:mx-4 sm:mt-4 sm:rounded-[20px]">
        <div className="mx-auto max-w-[680px]">
          <Link href={base} className="cls-eyebrow inline-flex items-center gap-1 text-[var(--color-gold)] hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {view.class.title}
          </Link>
          <p className="cls-eyebrow mt-5 text-white/50">
            Week {lesson.week}{lesson.weekTitle ? `: ${lesson.weekTitle}` : ""} · Lesson {lesson.number}
          </p>
          <h1 className="cls-display mt-2 text-4xl sm:text-5xl">{lesson.title}</h1>
          {lesson.description && <p className="mt-3 text-white/65">{lesson.description}</p>}
          {progress.completed && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-gold)]">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> You have completed this lesson
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto mt-8 max-w-[680px] space-y-6 px-4">
        {lesson.outcome && (
          <p className="rounded-[20px] bg-[var(--color-blush)] p-6 text-lg text-[var(--color-ink)] dark:bg-white/[0.06] dark:text-white">
            <span className="cls-eyebrow block text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">By the end, you can</span>
            <span className="mt-2 block">{lesson.outcome}</span>
          </p>
        )}

        {lesson.videoUrl && (
          <Block title={`Video · ${lesson.duration}`} done={progress.videoDone}>
            {embed ? (
              <div className="aspect-video overflow-hidden rounded-[12px] bg-black">
                <iframe
                  src={embed}
                  title={lesson.title}
                  className="h-full w-full"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="cls-btn cls-btn-outline">
                <PlayCircle className="h-4 w-4" aria-hidden /> Watch the video
              </a>
            )}
            {!progress.videoDone && (
              <button
                type="button"
                onClick={() => run(markVideo.mutateAsync(undefined))}
                disabled={markVideo.isPending}
                className="cls-btn cls-btn-primary mt-4"
              >
                I have watched it
              </button>
            )}
          </Block>
        )}

        {lesson.scriptures.length > 0 && (
          <Block title="Key scriptures">
            <ul className="space-y-2">
              {lesson.scriptures.map((s) =>
                s.text ? (
                  <li key={s.ref}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                        <span className="cls-scripture">{s.ref}</span>
                        <ChevronDown className="h-4 w-4 text-[var(--color-gold)] transition-transform group-open:rotate-180" aria-hidden />
                      </summary>
                      <p className="cls-display mt-2 border-l-2 border-[var(--color-gold)] pl-4 text-lg italic text-black/70 dark:text-white/75">{s.text}</p>
                    </details>
                  </li>
                ) : (
                  <li key={s.ref} className="cls-scripture">{s.ref}</li>
                ),
              )}
            </ul>
          </Block>
        )}

        {lesson.summary && (
          <Block title="Summary">
            <p className="whitespace-pre-line leading-relaxed text-black/75 dark:text-white/80">{lesson.summary}</p>
          </Block>
        )}

        {lesson.reflectionPrompt && (
          <Block title="Reflection" done={!!progress.reflection}>
            <label htmlFor="reflection" className="cls-display block text-xl text-[var(--color-ink)] dark:text-white">
              {lesson.reflectionPrompt}
            </label>
            <textarea
              id="reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Only you can see this."
              className="mt-3 w-full rounded-[12px] border border-[var(--color-pink-border)] bg-white p-3 text-base text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-burgundy)]/40 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
            />
            <button
              type="button"
              onClick={() => run(saveReflection.mutateAsync(reflection), "Reflection saved")}
              disabled={saveReflection.isPending || !reflection.trim() || reflection === progress.reflection}
              className="cls-btn cls-btn-primary mt-3"
            >
              {saveReflection.isPending ? "Saving..." : "Save reflection"}
            </button>
          </Block>
        )}

        {lesson.quiz.length > 0 && (
          <QuizBlock view={view} slug={slug} lessonRef={lessonRef} onCompleted={celebrate} />
        )}

        {lesson.actionStep && (
          <Block title="Action step" done={progress.actionDone}>
            <p className="text-lg text-[var(--color-ink)] dark:text-white">{lesson.actionStep}</p>
            {lesson.actionVerification === "LEADER" && (
              <p className="mt-2 text-sm text-black/55 dark:text-white/55">
                {progress.actionVerified ? "Verified by your leader." : "Your facilitator will verify this one."}
              </p>
            )}
            <label className="mt-4 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={progress.actionDone}
                disabled={setAction.isPending}
                onChange={(e) => run(setAction.mutateAsync({ done: e.target.checked }))}
                className="h-5 w-5 rounded accent-[var(--color-burgundy)]"
              />
              <span className="text-[var(--color-ink)] dark:text-white">I have done this</span>
            </label>
          </Block>
        )}

        <nav className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between" aria-label="Lessons">
          {view.previous ? (
            <Link href={`${base}/${view.previous.week}/${view.previous.slug}`} className="cls-btn cls-btn-outline">
              <ArrowLeft className="h-4 w-4" aria-hidden /> {view.previous.title}
            </Link>
          ) : (
            <span />
          )}
          {view.next &&
            (progress.completed ? (
              <Link href={`${base}/${view.next.week}/${view.next.slug}`} className="cls-btn cls-btn-primary">
                {view.next.title} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-black/50 dark:text-white/50">
                <Lock className="h-4 w-4" aria-hidden /> Finish this lesson to open the next
              </span>
            ))}
          {!view.next && progress.completed && (
            <Link href={base} className="cls-btn cls-btn-primary">
              Back to the class <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </nav>
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
    <Block title={`Quiz · ${quiz.length} question${quiz.length === 1 ? "" : "s"}`} done={progress.quizPassed}>
      {!showForm ? (
        <div>
          <p className="text-[var(--color-ink)] dark:text-white">
            Passed with {progress.quizScorePct}%{progress.quizAttempts > 1 ? ` after ${progress.quizAttempts} tries` : ""}.
          </p>
          <button type="button" onClick={() => { setRetaking(true); setResult(null); setAnswers(quiz.map(() => null)); }} className="cls-btn cls-btn-outline mt-3">
            Take it again
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {quiz.map((q, qi) => {
            const outcome = result?.results[qi];
            return (
              <fieldset key={q.id}>
                <legend className="font-semibold text-[var(--color-ink)] dark:text-white">
                  {qi + 1}. {q.prompt}
                  {result && (outcome ? (
                    <Check className="ml-2 inline h-4 w-4 text-green-600" aria-label="Right" />
                  ) : (
                    <X className="ml-2 inline h-4 w-4 text-red-600" aria-label="Not quite" />
                  ))}
                </legend>
                <div className="mt-2 space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-center gap-3 rounded-[12px] border p-3 ${
                        answers[qi] === oi ? "border-[var(--color-burgundy)] bg-[var(--color-chip)] dark:bg-white/[0.08]" : "border-[var(--color-pink-border)] dark:border-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[qi] === oi}
                        onChange={() => {
                          setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)));
                          setResult(null);
                        }}
                        className="accent-[var(--color-burgundy)]"
                      />
                      <span className="text-[var(--color-ink)] dark:text-white">{opt}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
          <button type="submit" disabled={submit.isPending || answers.some((a) => a === null)} className="cls-btn cls-btn-primary">
            {submit.isPending ? "Checking..." : "Check my answers"}
          </button>
        </form>
      )}
    </Block>
  );
}
