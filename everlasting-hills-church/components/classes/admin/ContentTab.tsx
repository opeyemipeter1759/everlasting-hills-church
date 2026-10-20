"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useClassContent, useSetQuiz, useUpdateLesson, type AdminLesson, type QuizItem } from "@/lib/api/classes";
import { showToast } from "@/components/ui/toast/toast";
import { ClassError, ClassLoading, errorText } from "../shared";

const input =
  "w-full rounded-[12px] border border-[var(--color-pink-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-burgundy)]/30 dark:border-white/15 dark:bg-white/[0.04] dark:text-white";

/** Ready means the learner can complete it: every lesson needs at least one part to do. */
function partsOf(l: AdminLesson) {
  return [l.videoUrl && "video", l.QuizItems.length && "quiz", l.reflectionPrompt && "reflection"].filter(Boolean) as string[];
}

export default function ContentTab({ courseId }: { courseId: string }) {
  const { data, isLoading, error, refetch } = useClassContent(courseId);
  const [lessonId, setLessonId] = useState<string | null>(null);

  if (isLoading) return <ClassLoading />;
  if (error || !data) return <ClassError error={error} onRetry={() => refetch()} />;

  const lessons = data.Modules.flatMap((m) => m.Lessons);
  const selected = lessons.find((l) => l.id === lessonId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <nav aria-label="Lessons" className="space-y-5">
        {data.Modules.map((m, wi) => (
          <div key={m.id}>
            <p className="cls-eyebrow text-[var(--color-crimson)] dark:text-[var(--color-gold)]">
              Week {wi + 1}{m.stage ? ` · ${m.stage}` : ""}
            </p>
            <p className="font-semibold text-[var(--color-ink)] dark:text-white">{m.title}</p>
            <ul className="mt-2 space-y-1">
              {m.Lessons.map((l, li) => {
                const parts = partsOf(l);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setLessonId(l.id)}
                      className={`flex w-full items-start gap-2 rounded-[10px] px-3 py-2 text-left text-sm ${
                        lessonId === l.id ? "bg-[var(--color-chip)] dark:bg-white/[0.08]" : "hover:bg-[var(--color-blush)] dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="w-5 flex-none text-black/40 dark:text-white/40">{li + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[var(--color-ink)] dark:text-white">{l.title}</span>
                        <span className="block text-xs text-black/45 dark:text-white/45">{parts.length ? parts.join(", ") : "nothing to do yet"}</span>
                      </span>
                      {l.videoUrl && l.QuizItems.length > 0 && <Check className="h-4 w-4 flex-none text-green-600" aria-label="Video and quiz in place" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div>
        {selected ? (
          <LessonEditor key={selected.id} lesson={selected} courseId={courseId} />
        ) : (
          <p className="rounded-[16px] border border-dashed border-[var(--color-pink-border)] p-8 text-center text-black/55 dark:border-white/15 dark:text-white/55">
            Choose a lesson to add its video, scriptures, summary, reflection question, and quiz.
          </p>
        )}
      </div>
    </div>
  );
}

function scripturesToText(s: AdminLesson["scriptures"]): string {
  return (Array.isArray(s) ? s : []).map((x) => (x.text ? `${x.ref} | ${x.text}` : x.ref)).join("\n");
}

function textToScriptures(t: string) {
  return t
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [ref, ...rest] = line.split("|");
      const text = rest.join("|").trim();
      return { ref: ref.trim(), ...(text ? { text } : {}) };
    });
}

function LessonEditor({ lesson, courseId }: { lesson: AdminLesson; courseId: string }) {
  const update = useUpdateLesson(courseId);
  const [f, setF] = useState({
    title: lesson.title,
    description: lesson.description ?? "",
    duration: lesson.duration,
    outcome: lesson.outcome ?? "",
    videoUrl: lesson.videoUrl ?? "",
    durationSeconds: lesson.durationSeconds ? String(lesson.durationSeconds) : "",
    scriptures: scripturesToText(lesson.scriptures),
    summary: lesson.summary ?? "",
    reflectionPrompt: lesson.reflectionPrompt ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync({
        lessonId: lesson.id,
        title: f.title,
        description: f.description,
        duration: f.duration,
        outcome: f.outcome,
        videoUrl: f.videoUrl,
        durationSeconds: f.durationSeconds.trim() ? Number(f.durationSeconds) : undefined,
        scriptures: textToScriptures(f.scriptures),
        summary: f.summary,
        reflectionPrompt: f.reflectionPrompt,
      });
      showToast.success("Lesson saved");
    } catch (err) {
      showToast.error(errorText(err));
    }
  }

  const field = (label: string, hint: string | null, el: React.ReactNode) => (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-[var(--color-ink)] dark:text-white">{label}</span>
      {hint && <span className="mb-1 block text-xs text-black/50 dark:text-white/50">{hint}</span>}
      {el}
    </label>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-4 rounded-[16px] border border-[var(--color-pink-border)] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          {field("Title", null, <input className={input} value={f.title} onChange={set("title")} maxLength={160} required />)}
          {field("Length", null, <input className={input} value={f.duration} onChange={set("duration")} maxLength={40} placeholder="10 min" />)}
        </div>
        {field("Short description", null, <input className={input} value={f.description} onChange={set("description")} maxLength={400} />)}
        {field("Outcome", '"By the end, you can..."', <input className={input} value={f.outcome} onChange={set("outcome")} maxLength={300} />)}
        {field("Video link", "YouTube (unlisted is fine). Must start with https://", <input className={input} type="url" value={f.videoUrl} onChange={set("videoUrl")} maxLength={400} placeholder="https://youtu.be/..." />)}
        {field(
          "Video length in seconds",
          "Found automatically when you save a new video link. Learners cannot be credited for watching until this is known, so fill it in if it is blank after saving.",
          <input className={input} type="number" min={1} max={43200} value={f.durationSeconds} onChange={set("durationSeconds")} placeholder="e.g. 754" />,
        )}
        {field(
          "Key scriptures",
          "One per line. Add the text after a bar to let learners expand it: John 3:16 | For God so loved...",
          <textarea className={input} rows={4} value={f.scriptures} onChange={set("scriptures")} />,
        )}
        {field("Summary", "One short paragraph", <textarea className={input} rows={4} value={f.summary} onChange={set("summary")} maxLength={3000} />)}
        {field("Reflection question", "Answers are private to the learner", <input className={input} value={f.reflectionPrompt} onChange={set("reflectionPrompt")} maxLength={500} />)}
        <button type="submit" disabled={update.isPending} className="cls-btn cls-btn-primary">
          {update.isPending ? "Saving..." : "Save lesson"}
        </button>
      </form>

      <QuizEditor lessonId={lesson.id} courseId={courseId} initial={lesson.QuizItems} />
    </div>
  );
}

function QuizEditor({ lessonId, courseId, initial }: { lessonId: string; courseId: string; initial: QuizItem[] }) {
  const setQuiz = useSetQuiz(courseId);
  const [items, setItems] = useState<QuizItem[]>(initial);
  useEffect(() => setItems(initial), [initial]);

  const change = (i: number, patch: Partial<QuizItem>) => setItems(items.map((q, qi) => (qi === i ? { ...q, ...patch } : q)));

  async function save() {
    try {
      await setQuiz.mutateAsync({ lessonId, items });
      showToast.success(items.length ? "Quiz saved" : "Quiz removed");
    } catch (err) {
      showToast.error(errorText(err));
    }
  }

  return (
    <section className="space-y-4 rounded-[16px] border border-[var(--color-pink-border)] bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div>
        <h3 className="font-semibold text-[var(--color-ink)] dark:text-white">Quiz</h3>
        <p className="text-xs text-black/50 dark:text-white/50">3 to 5 questions. Learners pass at 60%. The correct answers never leave the server.</p>
      </div>
      {items.map((q, i) => (
        <fieldset key={i} className="space-y-2 rounded-[12px] border border-[var(--color-pink-border)] p-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-black/50 dark:text-white/50">{i + 1}.</span>
            <input className={input} value={q.prompt} onChange={(e) => change(i, { prompt: e.target.value })} placeholder="The question" maxLength={400} aria-label={`Question ${i + 1}`} />
            <button type="button" onClick={() => setItems(items.filter((_, qi) => qi !== i))} aria-label={`Remove question ${i + 1}`} className="text-black/40 hover:text-red-600 dark:text-white/40">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2 pl-6">
              <input
                type="radio"
                name={`correct-${lessonId}-${i}`}
                checked={q.correctIndex === oi}
                onChange={() => change(i, { correctIndex: oi })}
                aria-label={`Option ${oi + 1} is correct`}
                className="accent-[var(--color-burgundy)]"
              />
              <input
                className={input}
                value={opt}
                onChange={(e) => change(i, { options: q.options.map((o, x) => (x === oi ? e.target.value : o)) })}
                placeholder={`Option ${oi + 1}`}
                maxLength={200}
                aria-label={`Question ${i + 1} option ${oi + 1}`}
              />
              {q.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => change(i, { options: q.options.filter((_, x) => x !== oi), correctIndex: q.correctIndex === oi ? 0 : q.correctIndex > oi ? q.correctIndex - 1 : q.correctIndex })}
                  aria-label={`Remove option ${oi + 1}`}
                  className="text-black/40 hover:text-red-600 dark:text-white/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {q.options.length < 6 && (
            <button type="button" onClick={() => change(i, { options: [...q.options, ""] })} className="ml-6 text-sm font-semibold text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">
              + Option
            </button>
          )}
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2">
        {items.length < 10 && (
          <button type="button" onClick={() => setItems([...items, { prompt: "", options: ["", "", ""], correctIndex: 0 }])} className="cls-btn cls-btn-outline !px-4 !py-2">
            <Plus className="h-4 w-4" aria-hidden /> Question
          </button>
        )}
        <button type="button" onClick={save} disabled={setQuiz.isPending} className="cls-btn cls-btn-primary !px-4 !py-2">
          {setQuiz.isPending ? "Saving..." : "Save quiz"}
        </button>
      </div>
    </section>
  );
}
