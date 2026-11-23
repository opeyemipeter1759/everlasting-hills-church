import { giftDayLabel } from "@/components/dashboard/member/member-home/GiftCountdown";

const DAY = 24 * 60 * 60 * 1000;

function daysToGo(targetIso: string): string {
  const days = Math.ceil((Date.parse(targetIso) - Date.now()) / DAY);
  if (days <= 0) return "Today";
  return days === 1 ? "Tomorrow" : `In ${days} days`;
}

/** What this page is for, and when the gift exchange & picnic happen. */
export default function GiftAdminHero({ targetDate }: { targetDate: string | null }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1]">
            End-of-year fellowship
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111] dark:text-white">Gift exchange &amp; picnic</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/65">
            Members sign up from their dashboard for the gift exchange, the picnic, or both. Everyone signed up for the gift
            exchange will be paired. Reject anyone who shouldn&apos;t take part: they&apos;ll see your reason, and you can
            reinstate them at any time.
          </p>
        </div>
        {targetDate && (
          <div className="rounded-xl border border-gray-200 px-4 py-3 text-right dark:border-white/10">
            <p className="text-xs text-gray-500 dark:text-white/50">Exchange day</p>
            <p className="text-sm font-semibold text-[#111] dark:text-white">{giftDayLabel(targetDate)}</p>
            <p className="text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1]">{daysToGo(targetDate)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
