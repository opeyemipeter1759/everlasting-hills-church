"use client";

import { useState } from "react";
import { Check } from "lucide-react";

/** The title suggestions; picking one fills in the title and subtitle. */
export function TitleIdeas({
  titles,
  onApply,
}: {
  titles: { title: string; subtitle: string }[];
  onApply: (title: string, subtitle: string) => void;
}) {
  const [applied, setApplied] = useState<number | null>(null);
  return (
    <ul className="space-y-2.5">
      {titles.map((t, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => {
              onApply(t.title, t.subtitle);
              setApplied(i);
            }}
            className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
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
  );
}
