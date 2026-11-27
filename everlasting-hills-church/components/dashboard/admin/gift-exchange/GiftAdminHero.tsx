import { CalendarDays } from "lucide-react";
import { giftDayLabel } from "@/components/dashboard/member/member-home/GiftCountdown";
import { PICNIC } from "@/components/picnic/picnic-config";
import PicnicCmsImage from "@/components/picnic/PicnicCmsImage";

const DAY = 24 * 60 * 60 * 1000;

function daysToGo(targetIso: string): string {
  const days = Math.ceil((Date.parse(targetIso) - Date.now()) / DAY);
  if (days <= 0) return "Today";
  return days === 1 ? "Tomorrow" : `In ${days} days`;
}

const GINGHAM = {
  backgroundColor: "#FBF6EE",
  backgroundImage:
    "linear-gradient(90deg, rgba(135,16,44,0.5) 50%, transparent 50%), linear-gradient(rgba(135,16,44,0.5) 50%, transparent 50%)",
  backgroundSize: "14px 14px",
} as const;

/** What this page is for, and when the picnic & gift exchange happen — on a picnic photograph. */
export default function GiftAdminHero({ targetDate }: { targetDate: string | null }) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl text-white">
      <PicnicCmsImage spot="verse" width={1800} fill sizes="(max-width: 1024px) 100vw, 1000px" className="-z-10 object-cover object-[center_62%]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1A0E07]/90 via-[#1A0E07]/65 to-[#1A0E07]/20" />

      <div className="flex flex-wrap items-end justify-between gap-6 px-6 pb-7 pt-12 sm:px-8 sm:pt-16">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-[#F7F0E3]/80">End-of-year fellowship</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Picnic &amp; gift exchange</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#F7F0E3]/80">
            Members sign up from their dashboard. Choosing the picnic includes the gift exchange, and everyone in the gift
            exchange will be paired. Anyone else can register on the{" "}
            <a href={PICNIC.path} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
              public picnic page
            </a>
            ; those sign-ups are listed at the bottom. Reject a member who shouldn&apos;t take part: they see your reason, and
            you can reinstate them at any time.
          </p>
        </div>
        {targetDate && (
          <div className="rounded-xl bg-[#F7F0E3] px-4 py-3 text-[#1B1714] shadow-sm">
            <p className="flex items-center gap-1.5 text-xs text-[#1B1714]/60">
              <CalendarDays size={13} aria-hidden="true" /> Gift partners revealed
            </p>
            <p className="mt-0.5 text-sm font-semibold">{giftDayLabel(targetDate)}</p>
            <p className="text-xs font-semibold text-[#87102C]">{daysToGo(targetDate)}</p>
          </div>
        )}
      </div>
      <div aria-hidden="true" className="h-2.5 w-full" style={GINGHAM} />
    </section>
  );
}
