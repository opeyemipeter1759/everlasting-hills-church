import Link from "next/link";
import { CheckCircle2, Calendar, Youtube, MessageCircle, Mic, BookOpen, Play } from "lucide-react";
import { CHURCH } from "@/config/config";
import type { MemberHomeProps } from "./types";
import { iconCl, kicker, muted } from "./tokens";
import { fmtDate, fmtTime, getServiceCountdown } from "./helpers";
import { PanelCard } from "./Primitives";

export function TodayAttendanceRecorded() {
  return (
    <PanelCard kicker="You're Here" title="Attendance Recorded" icon={CheckCircle2}>
      <div className="flex flex-col items-center justify-center py-6 text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-500 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#111] dark:text-white">Enjoy today&apos;s service!</p>
          <p className={`text-xs ${muted} mt-1 max-w-[200px] mx-auto leading-relaxed`}>
            Your presence has been marked. God bless you today.
          </p>
        </div>
        <div className="w-full space-y-2.5">
          <a href={CHURCH.youtubeUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1] text-xs font-semibold hover:bg-rose-100 dark:hover:bg-[#87102C]/35 transition-all">
            <Youtube size={13} />
            Watch on YouTube
          </a>
          <Link href="/dashboard/prayer-requests"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-[#E7CDD3]/60 dark:border-white/[0.09] text-[#8a7e80] dark:text-white/55 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all">
            <MessageCircle size={13} />
            Visit the Prayer Wall
          </Link>
        </div>
      </div>
    </PanelCard>
  );
}

export function TodayNextServiceCountdown({ nextService }: { nextService: NonNullable<MemberHomeProps["nextService"]> }) {
  const countdown = getServiceCountdown(nextService.scheduledAt);
  return (
    <PanelCard kicker="Upcoming" title="Next Service" icon={Calendar}>
      <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center">
          <Calendar size={28} className={iconCl} />
        </div>
        <div>
          <p className={`${kicker} mb-1`}>Countdown</p>
          <p className="text-3xl font-black text-[#111] dark:text-white tabular-nums">{countdown}</p>
          <p className="text-sm font-semibold text-[#8a7e80] dark:text-white/55 mt-1.5">{nextService.name}</p>
          <p className={`text-xs ${muted} mt-0.5`}>
            {fmtDate(nextService.scheduledAt, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className={`text-xs ${muted}`}>
            {fmtTime(nextService.scheduledAt)} · Hills Auditorium
          </p>
        </div>
        <a href={CHURCH.youtubeUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 text-[#87102C] dark:text-[#FFB3C1] text-xs font-semibold hover:bg-rose-100 dark:hover:bg-[#87102C]/35 transition-all">
          <Youtube size={13} />
          Watch while you wait
        </a>
      </div>
    </PanelCard>
  );
}

export function TodayFeaturedSermonTeaser({ featuredSermon }: {
  featuredSermon: NonNullable<MemberHomeProps["featuredSermon"]>;
}) {
  return (
    <PanelCard kicker="This Week" title="Featured Sermon" icon={Mic}>
      <div className="space-y-4">
        {featuredSermon.thumbnailUrl ? (
          <img src={featuredSermon.thumbnailUrl} alt={featuredSermon.title}
            className="w-full aspect-video rounded-xl object-cover" />
        ) : (
          <div className="w-full aspect-video rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center">
            <BookOpen size={24} className={iconCl} />
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-[#111] dark:text-white leading-snug line-clamp-2">
            {featuredSermon.title}
          </p>
          <p className={`text-xs ${muted} mt-0.5`}>{featuredSermon.speaker}</p>
        </div>
        <Link href={`/sermons/${featuredSermon.slug}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#87102C] text-white text-xs font-semibold hover:bg-[#6E0C24] transition-all">
          <Play size={12} fill="currentColor" />
          Listen now
        </Link>
      </div>
    </PanelCard>
  );
}
