"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import RichText from "@/components/ui/display/RichText";
import { diffWords } from "./diff";
import { DiffView } from "./DiffView";

const VIEWS = [
  ["result", "Suggestion"],
  ["changes", "Show changes"],
] as const;

/**
 * A rewrite, as rendered text or as marked-up changes against the original.
 * Corrections open on the changes, since that is how they are judged.
 */
export function Suggestion({
  original,
  text,
  notes,
  startOnChanges,
}: {
  original: string;
  text: string;
  notes: string[];
  startOnChanges: boolean;
}) {
  const [view, setView] = useState<"result" | "changes">(startOnChanges ? "changes" : "result");
  const diff = useMemo(() => diffWords(original, text), [original, text]);

  if (text.trim() === original.trim()) {
    return (
      <div className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-3.5 text-[13px]">
        <Check size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="m-ink">
          <span className="font-semibold">Looks good.</span> The assistant found nothing to change.
        </p>
      </div>
    );
  }

  return (
    <>
      {diff && (
        <div role="tablist" aria-label="Suggestion view" className="mb-3 inline-flex rounded-lg bg-[var(--m-brand-soft)] p-0.5 text-[12px] font-medium">
          {VIEWS.map(([v, label]) => (
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
          <RichText text={text} density="comfortable" className="m-ink font-serif text-[15px] leading-7" emphasisClassName="m-ink" />
        )}
      </div>
      {notes.length > 0 && (
        <ul className="m-muted mt-3 space-y-1 text-[12px]">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-2">
              <Check size={13} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--m-brand)]" />
              {n}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
