import { Clock3, Users } from "lucide-react";
import { SKY_GRADIENT, serif } from "./sky";

/** The page's heading, what the watch is, its scripture, and the watch-versus-family explanation. */
export function WatchIntro({ title }: { title: string }) {
  return (
    <>
      <span aria-hidden="true" className="block h-1.5 w-16 rounded-full" style={{ background: SKY_GRADIENT }} />
      <h1 style={serif} className="mt-4 text-2xl font-medium text-[#111] dark:text-white xs:text-3xl sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-white/60">
        Monday to Saturday, 10 PM to 6 AM, Everlasting Hills keeps an unbroken watch of prayer — eight hours, split into
        four two-hour watches. Sundays are kept for our corporate service. Every member is expected to commit to at
        least one two-hour watch daily.
      </p>

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px]" style={{ background: SKY_GRADIENT }} />
        <p style={serif} className="text-sm italic leading-relaxed text-[#6E0C24] dark:text-[#FFB3C1] sm:text-base">
          &ldquo;I have set watchmen upon thy walls, O Jerusalem, which shall never hold their peace day nor night:
          ye that make mention of the LORD, keep not silence, and give Him no rest, till He establish, and till He
          make Jerusalem a praise in the earth.&rdquo;
        </p>
        <p className="mt-2 text-xs font-medium text-[#87102C]/70 dark:text-[#FFB3C1]/70">Isaiah 62:6–7, KJV</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <Clock3 size={16} className="text-[#C97A3E]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[#111] dark:text-white">Prayer Watch</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/50">
            The two-hour window itself — where you join the others praying that hour on Telegram.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <Users size={16} className="text-[#C97A3E]" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-[#111] dark:text-white">Prayer Watchmen Family</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-white/50">
            The WhatsApp community of everyone on your watch hour — your committed prayer family for fellowship,
            encouragement, and accountability, not just the two hours.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-white/45">
        Life happens — if your usual hour doesn&apos;t work on a given day, you&apos;re free to pray along with any
        other active watch on Telegram. Your Prayer Watchmen Family stays the same either way. The hour you choose
        below becomes that family.
      </p>
    </>
  );
}
