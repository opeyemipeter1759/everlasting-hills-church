import { CalendarDays, Gift } from "lucide-react";
import { GiftCardDecor } from "@/components/dashboard/member/member-home/GiftCardDecor";
import { giftDayLabel } from "@/components/dashboard/member/member-home/GiftCountdown";

const DAY = 24 * 60 * 60 * 1000;

function daysToGo(targetIso: string): string {
  const days = Math.ceil((Date.parse(targetIso) - Date.now()) / DAY);
  if (days <= 0) return "It's today";
  return days === 1 ? "Tomorrow" : `In ${days} days`;
}

/** What this page is for, and when the gift exchange happens. */
export default function GiftAdminHero({ targetDate }: { targetDate: string | null }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#A3153A] via-[#87102C] to-[#4A0718] p-6 text-white shadow-[0_12px_32px_-12px_rgba(135,16,44,0.55)] sm:p-8">
      <GiftCardDecor />
      <div className="relative max-w-xl space-y-3 pr-16">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          <Gift size={22} className="text-[#F5C76B]" aria-hidden="true" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#F5C76B]">Gift Exchange</p>
        <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">Who&apos;s taking part</h1>
        <p className="text-sm leading-relaxed text-white/80">
          Members join with one tap on their dashboard. Everyone marked <b className="text-white">Interested</b> will be paired up
          for the exchange. Reject anyone who shouldn&apos;t take part. They&apos;ll see your reason, and you can reinstate them at any time.
        </p>
        {targetDate && (
          <p className="inline-flex flex-wrap items-center gap-2 rounded-full bg-black/20 px-3.5 py-1.5 text-xs font-semibold">
            <CalendarDays size={14} className="text-[#F5C76B]" aria-hidden="true" />
            Exchange day: {giftDayLabel(targetDate)}
            <span className="rounded-full bg-[#F5C76B] px-2 py-0.5 text-[11px] font-bold text-[#5A0A1E]">{daysToGo(targetDate)}</span>
          </p>
        )}
      </div>
    </section>
  );
}
