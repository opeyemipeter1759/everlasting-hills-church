import { BellRing, Clock } from "lucide-react";
import { card, muted } from "./tokens";
import { relativeTime } from "./helpers";

export function TodayAnnouncementsList({ announcements }: {
  announcements: Array<{ id: string; title: string; body: string; createdAt: string }>;
}) {
  return (
    <section className={`${card} overflow-hidden`}>
      {/* Gradient header */}
      <div
        className="px-5 py-4 flex items-center justify-between gap-3"
        style={{ background: "linear-gradient(135deg, #2a0410 0%, #4a0819 50%, #87102C 100%)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/20">
            <BellRing size={15} className="text-[#FFB3C1]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFB3C1]/70">
              From the Church
            </p>
            <h3 className="text-sm font-bold text-white truncate">Announcements</h3>
          </div>
        </div>
        <span className="flex-shrink-0 text-[10px] font-bold text-[#FFB3C1] bg-white/10 border border-white/15 px-2.5 py-1 rounded-full">
          {announcements.length} {announcements.length === 1 ? "update" : "updates"}
        </span>
      </div>

      {/* Announcement items */}
      <div className="overflow-y-auto max-h-[340px] divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E7CDD3] dark:[&::-webkit-scrollbar-thumb]:bg-white/20">
        {announcements.map((a, i) => (
          <div
            key={a.id}
            className={`flex gap-4 px-5 py-4 ${
              i === 0 ? "bg-[#FFF4F6] dark:bg-[#87102C]/10" : ""
            }`}
          >
            {/* Colored dot accent */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                i === 0 ? "bg-[#87102C] dark:bg-[#FFB3C1]" : "bg-[#E7CDD3] dark:bg-white/20"
              }`} />
              {i < announcements.length - 1 && (
                <div className="w-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07] min-h-[16px]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-[13px] font-bold leading-snug ${
                  i === 0
                    ? "text-[#87102C] dark:text-[#FFB3C1]"
                    : "text-[#111] dark:text-white"
                }`}>
                  {a.title}
                </p>
                {i === 0 && (
                  <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1] bg-[#FFE8ED] dark:bg-[#87102C]/25 px-2 py-0.5 rounded-full mt-0.5">
                    New
                  </span>
                )}
              </div>
              <p className={`text-xs ${muted} mt-1 leading-relaxed line-clamp-2`}>
                {a.body}
              </p>
              <p className={`text-[10px] ${muted} opacity-60 mt-1.5 flex items-center gap-1`}>
                <Clock size={9} className="flex-shrink-0" />
                {relativeTime(a.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
