"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Feather,
  Loader2,
  Maximize2,
  Minimize2,
  Repeat2,
  RotateCcw,
  Sparkles,
  SpellCheck,
  Type,
  Wand2,
  X,
} from "lucide-react";
import RichText from "@/components/ui/display/RichText";
import { assistWriting, type WritingAction, type WritingAssistResult } from "@/lib/api/articles";

export type RewriteAction = Exclude<WritingAction, "titles">;

export const AI_ACTIONS: { action: RewriteAction; label: string; hint: string; busy: string; Icon: typeof Sparkles }[] = [
  { action: "fix", label: "Fix spelling & grammar", hint: "Correct mistakes, keep your words", busy: "Checking spelling and grammar…", Icon: SpellCheck },
  { action: "improve", label: "Improve writing", hint: "Clearer, smoother, more engaging", busy: "Improving the writing…", Icon: Wand2 },
  { action: "rephrase", label: "Paraphrase", hint: "Same meaning, different words", busy: "Paraphrasing…", Icon: Repeat2 },
  { action: "simplify", label: "Simplify language", hint: "Plain English anyone can follow", busy: "Simplifying…", Icon: Feather },
  { action: "shorten", label: "Make shorter", hint: "Keep the main points", busy: "Making it shorter…", Icon: Minimize2 },
  { action: "expand", label: "Make longer", hint: "Develop your ideas further", busy: "Developing it further…", Icon: Maximize2 },
];

const TITLES_BUSY = "Reading your story for titles…";

/** What the AI works on, and how to put its answer back. */
export interface AssistTarget {
  /** "selection" or "story", for the panel's label. */
  scope: "selection" | "story";
  text: string;
  /** Replace the original with the suggestion. Returns false when the original moved. */
  replace: (markdown: string) => boolean;
  /** Put the suggestion after the original, keeping both. Not offered for the whole story. */
  insertAfter?: (markdown: string) => boolean;
}

type Job =
  | { status: "loading"; action: WritingAction; target: AssistTarget }
  | { status: "error"; action: WritingAction; target: AssistTarget; message: string }
  | { status: "done"; action: WritingAction; target: AssistTarget; result: WritingAssistResult };

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Runs one AI request at a time, and lets a newer one or Discard cancel it. */
export function useWritingAssist(context: { title: string; subtitle: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const controller = useRef<AbortController | null>(null);
  const contextRef = useRef(context);
  contextRef.current = context;

  const run = useCallback((action: WritingAction, target: AssistTarget) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setJob({ status: "loading", action, target });
    const { title, subtitle } = contextRef.current;
    assistWriting(action, target.text, { title: title.trim() || undefined, subtitle: subtitle.trim() || undefined }, ctrl.signal)
      .then((result) => {
        if (!ctrl.signal.aborted) setJob({ status: "done", action, target, result });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const e = err as { message?: string; status?: number; code?: string };
        const message =
          e.status === 429
            ? "You have used the writing assistant a lot in the last minute. Wait a moment and try again."
            : e.code === "ECONNABORTED"
              ? "The assistant took too long to answer. Try again, or select a smaller part of the story."
              : e.message || "The assistant could not answer. Please try again.";
        setJob({ status: "error", action, target, message });
      });
  }, []);

  const close = useCallback(() => {
    controller.current?.abort();
    setJob(null);
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  return { job, run, close };
}

// ── Menu ─────────────────────────────────────────────────────────────────────

/** The toolbar's AI button and its list of actions. */
export function AiMenu({
  scope,
  disabled,
  onPick,
}: {
  /** What the actions will work on right now. */
  scope: "selection" | "story";
  disabled?: boolean;
  onPick: (action: WritingAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (action: WritingAction) => {
    setOpen(false);
    onPick(action);
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        // Keep the editor's selection: the actions work on it.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-gradient-to-r from-[var(--m-brand)] to-[#b4234a] px-2.5 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <Sparkles size={14} aria-hidden="true" />
        AI assist
        <ChevronDown size={13} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="AI writing assistant"
          className="m-paper absolute left-0 top-full z-40 mt-2 w-[290px] overflow-hidden rounded-xl border m-rule py-1.5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)] max-sm:fixed max-sm:inset-x-3 max-sm:top-auto max-sm:w-auto"
        >
          <p className="m-muted px-3.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider">
            {scope === "selection" ? "Edit the selected text" : "Edit the whole story"}
          </p>
          {AI_ACTIONS.map(({ action, label, hint, Icon }) => (
            <button
              key={action}
              type="button"
              role="menuitem"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(action)}
              className="flex w-full items-start gap-3 px-3.5 py-2 text-left transition-colors hover:bg-[var(--m-brand-soft)]"
            >
              <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--m-brand)]" />
              <span className="min-w-0">
                <span className="m-ink block text-[13px] font-medium">{label}</span>
                <span className="m-muted block text-[12px]">{hint}</span>
              </span>
            </button>
          ))}
          <div className="my-1.5 border-t m-rule" />
          <p className="m-muted px-3.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider">Your story</p>
          <button
            type="button"
            role="menuitem"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick("titles")}
            className="flex w-full items-start gap-3 px-3.5 py-2 text-left transition-colors hover:bg-[var(--m-brand-soft)]"
          >
            <Type size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--m-brand)]" />
            <span className="min-w-0">
              <span className="m-ink block text-[13px] font-medium">Suggest a title</span>
              <span className="m-muted block text-[12px]">Three title and subtitle ideas</span>
            </span>
          </button>
          <p className="m-muted border-t m-rule px-3.5 pb-1 pt-2 text-[11px]">
            AI can make mistakes. Read each suggestion before you use it.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Diff ─────────────────────────────────────────────────────────────────────

type DiffPart = { kind: "same" | "add" | "del"; text: string };
const DIFF_TOKEN_LIMIT = 2_500;

/** Word-level diff (longest common subsequence). Null when too long to compare quickly. */
export function diffWords(before: string, after: string): DiffPart[] | null {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  if (a.length > DIFF_TOKEN_LIMIT || b.length > DIFF_TOKEN_LIMIT) return null;
  const n = a.length;
  const m = b.length;
  const table = new Uint16Array((n + 1) * (m + 1));
  const at = (i: number, j: number) => i * (m + 1) + j;
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[at(i, j)] = a[i] === b[j] ? table[at(i + 1, j + 1)] + 1 : Math.max(table[at(i + 1, j)], table[at(i, j + 1)]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (kind: DiffPart["kind"], text: string) => {
    const last = parts[parts.length - 1];
    if (last?.kind === kind) last.text += text;
    else parts.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i += 1;
      j += 1;
    } else if (table[at(i + 1, j)] >= table[at(i, j + 1)]) {
      push("del", a[i]);
      i += 1;
    } else {
      push("add", b[j]);
      j += 1;
    }
  }
  while (i < n) push("del", a[i++]);
  while (j < m) push("add", b[j++]);
  return coalesce(parts);
}

/**
 * Joins edits separated only by a space, so "i has" → "I have" shows as one
 * crossed-out phrase and one new phrase, not alternating single words.
 */
function coalesce(parts: DiffPart[]): DiffPart[] {
  const out: DiffPart[] = [];
  let del = "";
  let add = "";
  let gap = "";
  const flush = () => {
    if (del) out.push({ kind: "del", text: del });
    if (add) out.push({ kind: "add", text: add });
    del = "";
    add = "";
  };
  for (const part of parts) {
    if (part.kind === "same") {
      if (/^\s+$/.test(part.text) && (del || add)) {
        gap += part.text;
        continue;
      }
      flush();
      out.push({ kind: "same", text: gap + part.text });
      gap = "";
      continue;
    }
    if (gap) {
      if (del) del += gap;
      if (add) add += gap;
      gap = "";
    }
    if (part.kind === "del") del += part.text;
    else add += part.text;
  }
  flush();
  if (gap) out.push({ kind: "same", text: gap });
  return out;
}

function DiffView({ parts }: { parts: DiffPart[] }) {
  return (
    <p className="m-ink whitespace-pre-wrap font-serif text-[15px] leading-7 [overflow-wrap:anywhere]">
      {parts.map((p, i) =>
        p.kind === "same" ? (
          <span key={i}>{p.text}</span>
        ) : p.kind === "del" ? (
          <del key={i} className="rounded-sm bg-red-500/15 text-red-700 decoration-red-500/60 dark:text-red-300">
            {p.text}
          </del>
        ) : (
          <ins key={i} className="rounded-sm bg-emerald-500/15 text-emerald-800 no-underline dark:text-emerald-300">
            {p.text}
          </ins>
        ),
      )}
    </p>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

/**
 * The suggestion, beside the writing rather than over it: a floating card at
 * the bottom right (a sheet above the bottom bar on phones), so the member can
 * still read their own words while deciding. Nothing changes in the story
 * until they press Replace or Insert.
 */
export function AiPanel({
  job,
  onClose,
  onRetry,
  onApplyTitle,
}: {
  job: Job | null;
  onClose: () => void;
  onRetry: () => void;
  onApplyTitle: (title: string, subtitle: string) => void;
}) {
  const [view, setView] = useState<"result" | "changes">("result");
  const [stale, setStale] = useState(false);
  const [applied, setApplied] = useState<number | null>(null);

  const meta = job ? AI_ACTIONS.find((a) => a.action === job.action) : undefined;
  const result = job?.status === "done" ? job.result : null;
  const rewritten = result && result.action !== "titles" ? result : null;
  const diff = useMemo(
    () => (rewritten && job ? diffWords(job.target.text, rewritten.text) : null),
    [rewritten, job],
  );
  const unchanged = Boolean(rewritten && job && rewritten.text.trim() === job.target.text.trim());

  useEffect(() => {
    setStale(false);
    setApplied(null);
    // Corrections are easiest to judge as marked-up changes; rewrites as text.
    setView(job?.action === "fix" ? "changes" : "result");
  }, [job]);

  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [job, onClose]);

  if (!job) return null;

  const title = job.action === "titles" ? "Title ideas" : meta?.label ?? "AI suggestion";
  const Icon = job.action === "titles" ? Type : meta?.Icon ?? Sparkles;
  const apply = (how: "replace" | "insert") => {
    if (!rewritten) return;
    const ok = how === "replace" ? job.target.replace(rewritten.text) : job.target.insertAfter?.(rewritten.text);
    if (ok) onClose();
    else setStale(true);
  };

  return (
    <section
      role="dialog"
      aria-label={`AI writing assistant: ${title}`}
      className="m-paper fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex max-h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border m-rule font-sans shadow-[0_24px_64px_-16px_rgba(0,0,0,0.4)] md:inset-x-auto md:bottom-6 md:right-6 md:w-[460px]"
    >
      <header className="flex items-center gap-3 border-b m-rule px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--m-brand)] to-[#b4234a] text-white">
          <Icon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-ink truncate text-[14px] font-semibold">{title}</p>
          <p className="m-muted text-[12px]">
            {job.action === "titles"
              ? "Based on your whole story"
              : `${job.target.scope === "selection" ? "Selected text" : "Whole story"} · ${wordCount(job.target.text).toLocaleString()} words`}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close the assistant" className="m-muted rounded-md p-1.5 hover:bg-[var(--m-brand-soft)] hover:text-[var(--m-ink)]">
          <X size={16} aria-hidden="true" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {job.status === "loading" && (
          <div aria-live="polite" aria-busy="true">
            <p className="m-muted flex items-center gap-2 text-[13px]">
              <Loader2 size={15} className="animate-spin text-[var(--m-brand)]" aria-hidden="true" />
              {job.action === "titles" ? TITLES_BUSY : meta?.busy}
            </p>
            <div className="mt-4 space-y-2.5">
              {[92, 100, 84, 96, 70].map((w) => (
                <div key={w} className="h-3 animate-pulse rounded-full bg-[var(--m-line)]" style={{ width: `${w}%` }} />
              ))}
            </div>
            {job.target.scope === "story" && wordCount(job.target.text) > 800 && (
              <p className="m-muted mt-4 text-[12px]">Long stories take a little longer. You can keep writing meanwhile.</p>
            )}
          </div>
        )}

        {job.status === "error" && (
          <div role="alert" className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3.5 text-[13px]">
            <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="m-ink font-semibold">The assistant could not finish</p>
              <p className="m-body mt-0.5">{job.message}</p>
            </div>
          </div>
        )}

        {result?.action === "titles" && (
          <ul className="space-y-2.5">
            {result.titles.map((t, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    onApplyTitle(t.title, t.subtitle);
                    setApplied(i);
                  }}
                  className={`group w-full rounded-xl border p-3.5 text-left transition-colors ${
                    applied === i ? "border-[var(--m-brand)] bg-[var(--m-brand-soft)]" : "m-rule hover:border-[var(--m-brand)]"
                  }`}
                >
                  <span className="m-display m-ink block text-[19px] leading-snug">{t.title}</span>
                  {t.subtitle && <span className="m-muted mt-1 block text-[13px] leading-snug">{t.subtitle}</span>}
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--m-brand)]">
                    {applied === i ? (
                      <>
                        <Check size={13} aria-hidden="true" /> Using this title
                      </>
                    ) : (
                      "Use this title"
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {rewritten && (
          <>
            {unchanged ? (
              <div className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-3.5 text-[13px]">
                <Check size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="m-ink">
                  <span className="font-semibold">Looks good.</span> The assistant found nothing to change.
                </p>
              </div>
            ) : (
              <>
                {diff && (
                  <div role="tablist" aria-label="Suggestion view" className="mb-3 inline-flex rounded-lg bg-[var(--m-brand-soft)] p-0.5 text-[12px] font-medium">
                    {(
                      [
                        ["result", "Suggestion"],
                        ["changes", "Show changes"],
                      ] as const
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={view === v}
                        onClick={() => setView(v)}
                        className={`rounded-md px-2.5 py-1 transition-colors ${
                          view === v ? "m-paper m-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "m-muted hover:text-[var(--m-ink)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="rounded-xl border m-rule bg-[var(--m-canvas)] p-4">
                  {view === "changes" && diff ? (
                    <DiffView parts={diff} />
                  ) : (
                    <RichText text={rewritten.text} density="comfortable" className="m-ink font-serif text-[15px] leading-7" emphasisClassName="m-ink" />
                  )}
                </div>
              </>
            )}
            {rewritten.notes.length > 0 && !unchanged && (
              <ul className="m-muted mt-3 space-y-1 text-[12px]">
                {rewritten.notes.map((n, i) => (
                  <li key={i} className="flex gap-2">
                    <Check size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--m-brand)]" />
                    {n}
                  </li>
                ))}
              </ul>
            )}
            {stale && (
              <p role="alert" className="mt-3 text-[12px] text-red-600 dark:text-red-400">
                That part of the story has changed since you asked. Select it again and retry.
              </p>
            )}
          </>
        )}
      </div>

      {job.status !== "loading" && (
        <footer className="flex flex-wrap items-center gap-2 border-t m-rule px-4 py-3">
          {rewritten && !unchanged && (
            <>
              <button type="button" onClick={() => apply("replace")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--m-brand)] px-4 text-[13px] font-semibold text-[var(--m-on-brand)] hover:bg-[var(--m-brand-hover)]">
                <Check size={14} aria-hidden="true" /> {job.target.scope === "story" ? "Replace story" : "Replace"}
              </button>
              {job.target.insertAfter && (
                <button type="button" onClick={() => apply("insert")} className="m-ink inline-flex h-9 items-center rounded-full border m-rule px-3.5 text-[13px] font-medium hover:border-[var(--m-ink)]">
                  Insert below
                </button>
              )}
            </>
          )}
          <button type="button" onClick={onRetry} className="m-muted inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium hover:bg-[var(--m-brand-soft)] hover:text-[var(--m-ink)]">
            <RotateCcw size={14} aria-hidden="true" /> Try again
          </button>
          <button type="button" onClick={onClose} className="m-muted ml-auto inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium hover:text-[var(--m-ink)]">
            {result?.action === "titles" || unchanged ? "Done" : "Discard"}
          </button>
        </footer>
      )}
      {job.status === "loading" && (
        <footer className="flex justify-end border-t m-rule px-4 py-3">
          <button type="button" onClick={onClose} className="m-muted inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium hover:text-[var(--m-ink)]">
            Cancel
          </button>
        </footer>
      )}
    </section>
  );
}
