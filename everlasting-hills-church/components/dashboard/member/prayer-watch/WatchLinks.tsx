import Link from "next/link";
import { CalendarPlus, ClipboardCheck, MessageCircle, Send } from "lucide-react";
import { myPrayerWatchIcsHref, type MySignupView } from "@/lib/api/prayer-watch";

const BUTTON = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm transition-colors xs:w-auto";

/** Where a confirmed watcher goes next: Telegram, their WhatsApp family, their calendar, and (leaders) the report. */
export function WatchLinks({ mine }: { mine: MySignupView }) {
  return (
    <div className="mt-5 flex flex-col items-stretch gap-2 xs:flex-row xs:flex-wrap xs:items-center xs:justify-center">
      {mine.telegramLink && (
        <a href={mine.telegramLink} target="_blank" rel="noopener noreferrer" className={`${BUTTON} bg-[#26A5E4] font-bold text-white hover:bg-[#1E8FC7]`}>
          <Send size={16} aria-hidden="true" />
          Join the Telegram channel
        </a>
      )}
      {mine.slot.whatsappLink && (
        <a href={mine.slot.whatsappLink} target="_blank" rel="noopener noreferrer" className={`${BUTTON} bg-[#25D366] font-bold text-white hover:bg-[#1FBD59]`}>
          <MessageCircle size={16} aria-hidden="true" />
          Join your Prayer Watchmen Family
        </a>
      )}
      <a href={myPrayerWatchIcsHref(mine.signup.id)} className={`${BUTTON} border border-current font-semibold opacity-80 hover:bg-white/10 hover:opacity-100`}>
        <CalendarPlus size={16} aria-hidden="true" />
        Add to calendar
      </a>
      {mine.leadsWatch && (
        <Link href="/dashboard/prayer-watch/report" className={`${BUTTON} bg-white font-bold text-[#150E22] hover:bg-white/90`}>
          <ClipboardCheck size={16} aria-hidden="true" />
          Report the watch
        </Link>
      )}
    </div>
  );
}
