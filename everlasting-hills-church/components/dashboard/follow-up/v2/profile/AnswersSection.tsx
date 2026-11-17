"use client";

import { FIRST_TIMER_FIELDS, answerText } from "@/lib/first-timer/fields";
import type { ProfileSectionProps } from "./types";

/**
 * Every answer from the first-timer form, worded and ordered as the form asks
 * them. Pastoral answers appear here, on the person's own profile, and nowhere
 * else; they are set apart so nobody reads them out by accident.
 */
export default function AnswersSection({ profile }: ProfileSectionProps) {
  return <FormAnswers answers={profile.answers} showPastoral />;
}

/** The answers as a definition list. Lists and the Overview pass answers that never include pastoral fields. */
export function FormAnswers({ answers, showPastoral = false }: { answers: Record<string, unknown>; showPastoral?: boolean }) {
  const shown = FIRST_TIMER_FIELDS.filter((f) => !f.pastoral && answerText(f, answers[f.key]) !== null);
  const pastoral = showPastoral ? FIRST_TIMER_FIELDS.filter((f) => f.pastoral && answerText(f, answers[f.key]) !== null) : [];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]" aria-label="Form answers">
      <h2 className="text-sm font-semibold text-[#111] dark:text-white">Their answers</h2>
      <dl className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {shown.map((f) => (
          <div key={f.key}>
            <dt className="text-xs text-gray-500 dark:text-white/45">{f.label}</dt>
            <dd className="text-sm text-gray-800 dark:text-white/80">{answerText(f, answers[f.key])}</dd>
          </div>
        ))}
      </dl>
      {pastoral.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-50/70 p-4 dark:bg-amber-500/[0.07]">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Pastoral, for this profile only</p>
          <dl className="mt-2 space-y-2.5">
            {pastoral.map((f) => (
              <div key={f.key}>
                <dt className="text-xs text-amber-900/70 dark:text-amber-200/60">{f.label}</dt>
                <dd className="whitespace-pre-line text-sm text-gray-800 dark:text-white/80">{answerText(f, answers[f.key])}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
