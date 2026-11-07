"use client";

import { useEffect, useState } from "react";
import { Sparkles, Type, X } from "lucide-react";
import { AI_ACTIONS, TITLES_BUSY, wordCount, type Job } from "./actions";
import { PanelError, PanelLoading } from "./PanelStates";
import { PanelFooter } from "./PanelFooter";
import { Suggestion } from "./Suggestion";
import { TitleIdeas } from "./TitleIdeas";

/**
 * The suggestion, beside the writing rather than over it: a floating card at
 * the bottom right (a sheet above the bottom bar on phones). Nothing in the
 * story changes until the member presses Replace or Insert.
 */
export function AiPanel({ job, onClose, onRetry, onApplyTitle }: {
  job: Job | null;
  onClose: () => void;
  onRetry: () => void;
  onApplyTitle: (title: string, subtitle: string) => void;
}) {
  const [stale, setStale] = useState(false);
  useEffect(() => setStale(false), [job]);
  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [job, onClose]);
  if (!job) return null;

  const meta = AI_ACTIONS.find((a) => a.action === job.action);
  const result = job.status === "done" ? job.result : null;
  const rewrite = result && result.action !== "titles" ? result : null;
  const unchanged = Boolean(rewrite && rewrite.text.trim() === job.target.text.trim());
  const title = job.action === "titles" ? "Title ideas" : meta?.label ?? "AI suggestion";
  const Icon = job.action === "titles" ? Type : meta?.Icon ?? Sparkles;
  const words = wordCount(job.target.text);
  const apply = (how: "replace" | "insert") => {
    if (!rewrite) return;
    const ok = how === "replace" ? job.target.replace(rewrite.text) : job.target.insertAfter?.(rewrite.text);
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
              : `${job.target.scope === "selection" ? "Selected text" : "Whole story"} · ${words.toLocaleString()} words`}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close the assistant" className="m-muted rounded-md p-1.5 hover:bg-[var(--m-brand-soft)] hover:text-[var(--m-ink)]">
          <X size={16} aria-hidden="true" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {job.status === "loading" && (
          <PanelLoading message={job.action === "titles" ? TITLES_BUSY : meta?.busy ?? "Working…"} long={job.target.scope === "story" && words > 800} />
        )}
        {job.status === "error" && <PanelError message={job.message} />}
        {result?.action === "titles" && (
          <TitleIdeas key={result.titles.map((t) => t.title).join("|")} titles={result.titles} onApply={onApplyTitle} />
        )}
        {rewrite && (
          <Suggestion key={rewrite.text} original={job.target.text} text={rewrite.text} notes={rewrite.notes} startOnChanges={job.action === "fix"} />
        )}
        {stale && (
          <p role="alert" className="mt-3 text-[12px] text-red-600 dark:text-red-400">
            That part of the story has changed since you asked. Select it again and retry.
          </p>
        )}
      </div>

      <PanelFooter
        loading={job.status === "loading"}
        canApply={Boolean(rewrite) && !unchanged}
        wholeStory={job.target.scope === "story"}
        canInsert={Boolean(job.target.insertAfter)}
        finished={result?.action === "titles" || unchanged}
        onReplace={() => apply("replace")}
        onInsert={() => apply("insert")}
        onRetry={onRetry}
        onClose={onClose}
      />
    </section>
  );
}
