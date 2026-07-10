import Link from "next/link";
import { Youtube, MessageCircle, Heart, ChevronRight, Users } from "lucide-react";
import { CHURCH } from "@/config/config";
import { iconBg, iconCl, muted } from "./tokens";
import { PanelCard } from "./Primitives";

export function TodayStayConnected() {
  return (
    <PanelCard kicker="Community" title="Stay Connected" icon={Users}>
      <div className="flex flex-col gap-3">
        <a
          href={CHURCH.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/20 border border-[#E7CDD3]/60 dark:border-[#87102C]/30 hover:bg-rose-100 dark:hover:bg-[#87102C]/30 transition-colors group"
        >
          <span className={iconBg}>
            <Youtube size={15} className={iconCl} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111] dark:text-white">Watch on YouTube</p>
            <p className={`text-[11px] ${muted}`}>Sermons, live services &amp; more</p>
          </div>
          <ChevronRight size={14} className={`${iconCl} ml-auto flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`} />
        </a>
        <a
          href={CHURCH.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors group"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/25">
            <MessageCircle size={15} className="text-emerald-600 dark:text-emerald-400" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111] dark:text-white">WhatsApp Community</p>
            <p className={`text-[11px] ${muted}`}>Join the church group</p>
          </div>
          <ChevronRight size={14} className="text-emerald-500 ml-auto flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
        </a>
        <Link
          href="/dashboard/prayer-requests"
          className="flex items-center gap-3.5 p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors group"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/25">
            <Heart size={15} className="text-violet-600 dark:text-violet-400" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#111] dark:text-white">Prayer Wall</p>
            <p className={`text-[11px] ${muted}`}>Share a request or pray for others</p>
          </div>
          <ChevronRight size={14} className="text-violet-500 ml-auto flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </PanelCard>
  );
}
