// ── Band 1: Birthday Banner ───────────────────────────────────────────────────

export function BirthdayBanner({ firstName, daysUntil }: { firstName: string; daysUntil: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-200/60 dark:border-pink-500/20 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 px-6 py-4 flex items-center gap-4">
      <span className="text-3xl flex-shrink-0" aria-hidden="true">{daysUntil === 0 ? "🎂" : "🎉"}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-pink-700 dark:text-pink-300">
          {daysUntil === 0
            ? `Happy Birthday, ${firstName}! 🎊`
            : `Your birthday is ${daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`}!`}
        </p>
        <p className="text-xs text-pink-500/80 dark:text-pink-400/80 mt-0.5">
          {daysUntil === 0
            ? "The Everlasting Hills family celebrates you today."
            : "Sending warm wishes ahead from the EHC family."}
        </p>
      </div>
    </div>
  );
}

// ── Band 1: Anniversary Banner ────────────────────────────────────────────────

export function AnniversaryBanner({ firstName, memberSince, daysUntil }: {
  firstName: string;
  memberSince: string;
  daysUntil: number;
}) {
  const years = new Date().getFullYear() - new Date(memberSince).getFullYear();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/10 px-6 py-4 flex items-center gap-4">
      <span className="text-3xl flex-shrink-0" aria-hidden="true">{daysUntil === 0 ? "🎊" : "📅"}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
          {daysUntil === 0
            ? `Happy ${years}-year anniversary, ${firstName}!`
            : `Your ${years}-year church anniversary is ${daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`}!`}
        </p>
        <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
          {daysUntil === 0
            ? `${years} year${years !== 1 ? "s" : ""} of faithfulness — the EHC family celebrates you today.`
            : "We are grateful for your years of faithful commitment to this community."}
        </p>
      </div>
    </div>
  );
}
