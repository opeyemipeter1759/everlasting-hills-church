"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MEMBERSHIP_WEEKS } from "./membership-content";

const TOTAL_LESSONS = MEMBERSHIP_WEEKS.reduce((n, w) => n + w.lessons.length, 0);

const STATS: [string, string][] = [
  [String(MEMBERSHIP_WEEKS.length), "weeks"],
  [String(TOTAL_LESSONS), "lessons"],
  ["45", "minute session each week"],
];

/**
 * The curriculum as a console: weeks down the left like accounts, and the
 * selected week's lessons as a ledger on the right, each with its own
 * reference (1.1, 1.2, ...). All four panels are in the page, so the outline
 * reads without scripts; the tabs only choose which one is showing.
 */
export default function CurriculumTabs() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (i: number, focus = false) => {
    const next = (i + MEMBERSHIP_WEEKS.length) % MEMBERSHIP_WEEKS.length;
    setActive(next);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      select(active + 1, true);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      select(active - 1, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      select(0, true);
    } else if (e.key === "End") {
      e.preventDefault();
      select(MEMBERSHIP_WEEKS.length - 1, true);
    }
  };

  const week = MEMBERSHIP_WEEKS[active];
  const next = MEMBERSHIP_WEEKS[active + 1];
  const prev = MEMBERSHIP_WEEKS[active - 1];

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--color-pink-border)] bg-white">
      {/* Summary strip */}
      <dl className="grid grid-cols-3 divide-x divide-[var(--color-pink-border)] border-b border-[var(--color-pink-border)]">
        {STATS.map(([value, label]) => (
          <div key={label} className="px-4 py-5 sm:px-8 sm:py-6">
            <dd className="cls-display text-3xl tabular-nums sm:text-5xl">{value}</dd>
            <dt className="mt-1 text-xs text-black/55 sm:text-sm">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Weeks */}
        <div
          role="tablist"
          aria-label="Weeks of the Membership Class"
          aria-orientation="vertical"
          onKeyDown={onKeyDown}
          className="grid grid-cols-4 gap-1 border-b border-[var(--color-pink-border)] bg-[var(--color-blush)]/60 p-2 lg:flex lg:flex-col lg:gap-1 lg:border-b-0 lg:border-r lg:p-3"
        >
          {MEMBERSHIP_WEEKS.map((w, i) => {
            const on = i === active;
            return (
              <button
                key={w.number}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`week-tab-${w.number}`}
                aria-selected={on}
                aria-controls={`week-panel-${w.number}`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(i)}
                className={`relative rounded-[14px] px-3 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)] lg:px-4 lg:py-4 ${
                  on ? "bg-white ring-1 ring-[var(--color-pink-border)]" : "hover:bg-white/60"
                }`}
              >
                {on && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 hidden h-8 w-[3px] -translate-y-1/2 rounded-full bg-[var(--color-burgundy)] lg:block"
                  />
                )}
                <span className={`block text-xs font-semibold tabular-nums ${on ? "text-[var(--color-burgundy)]" : "text-black/45"}`}>
                  <span className="lg:hidden">{w.number}</span>
                  <span className="hidden lg:inline">Week {w.number}</span>
                </span>
                <span className={`mt-0.5 hidden text-[15px] font-semibold leading-snug lg:block ${on ? "text-[var(--color-ink)]" : "text-black/70"}`}>
                  {w.title}
                </span>
                <span className="mt-1 hidden text-xs text-black/50 lg:block">
                  {w.stage}, {w.lessons.length} lessons
                </span>
                <span className={`mt-0.5 block text-sm font-semibold lg:hidden ${on ? "text-[var(--color-ink)]" : "text-black/60"}`}>
                  {w.stage}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected week */}
        <div className="min-w-0">
          {MEMBERSHIP_WEEKS.map((w, i) => (
            <div
              key={w.number}
              role="tabpanel"
              id={`week-panel-${w.number}`}
              aria-labelledby={`week-tab-${w.number}`}
              hidden={i !== active}
              className={i === active ? "cls-reveal" : undefined}
            >
              <div className="border-b border-[var(--color-pink-border)] px-5 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="cls-chip">{w.stage}</span>
                  <span className="text-sm tabular-nums text-black/50">
                    Week {w.number} of {MEMBERSHIP_WEEKS.length}
                  </span>
                </div>
                <h3 className="cls-display mt-4 text-3xl sm:text-4xl">{w.title}</h3>
                <p className="mt-2 max-w-xl text-black/60">{w.subtitle}</p>
              </div>

              <ol>
                {w.lessons.map(([title, desc], li) => (
                  <li
                    key={title}
                    className="flex items-start gap-4 border-b border-[var(--color-pink-border)] px-5 py-5 last:border-b-0 sm:gap-5 sm:px-8"
                  >
                    <span className="mt-0.5 inline-flex h-9 min-w-[2.75rem] flex-none items-center justify-center rounded-[10px] bg-[var(--color-blush)] text-sm font-semibold tabular-nums text-[var(--color-burgundy)]">
                      {w.number}.{li + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{title}</span>
                      <span className="mt-0.5 block text-[15px] leading-relaxed text-black/60">{desc}</span>
                    </span>
                    <span className="hidden flex-none pt-1 text-xs text-black/40 sm:block">Video and summary</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          {/* Week switcher */}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-pink-border)] bg-[var(--color-blush)]/60 px-5 py-4 sm:px-8">
            <p className="hidden text-sm text-black/55 sm:block">Watch the video, write a short summary, then join the Sunday session.</p>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={() => select(active - 1)}
                disabled={!prev}
                className="cls-btn cls-btn-outline !px-4 !py-2 !text-sm"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {prev ? `Week ${prev.number}` : "Start"}
              </button>
              <button
                type="button"
                onClick={() => select(active + 1)}
                disabled={!next}
                className="cls-btn cls-btn-primary !px-4 !py-2 !text-sm"
              >
                {next ? `Week ${next.number}: ${next.stage}` : "Final week"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
