import Link from "next/link";
import { Headphones, ChevronRight, Play } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { iconBg, iconCl, muted, linkCl } from "./tokens";
import { fmtShortDate } from "./helpers";
import { PanelCard } from "./Primitives";

export function ContinueListeningCard({ listenHistory }: {
  listenHistory: MemberHomeProps["listenHistory"];
}) {
  return (
    <PanelCard
      kicker="Content"
      title="Continue Listening"
      icon={Headphones}
      action={
        <Link href="/dashboard/sermon" className={linkCl}>All sermons <ChevronRight size={12} /></Link>
      }
    >
      {listenHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <span className={`${iconBg} !w-11 !h-11 !rounded-xl`}>
            <Headphones size={18} className={iconCl} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">No listening history yet</p>
            <Link href="/dashboard/sermons" className={`${linkCl} justify-center mt-1`}>
              Start listening <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {listenHistory.slice(0, 5).map((p) => {
            const pct = p.audioDuration && p.audioDuration > 0
              ? Math.min(100, Math.round((p.positionSec / p.audioDuration) * 100))
              : null;
            return (
              <Link key={p.slug} href={`/dashboard/sermon/${p.slug}`}
                className="flex gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition-colors group">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.title} className="w-12 aspect-video rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 aspect-video rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                    <Play size={12} className={iconCl} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#111] dark:text-white group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] transition-colors line-clamp-1">{p.title}</p>
                  <p className={`text-[10px] ${muted} mt-0.5`}>{p.speaker} · {fmtShortDate(p.date)}</p>
                  {pct !== null && !p.completed && (
                    <div className="mt-1.5 h-1 rounded-full bg-[#E7CDD3]/50 dark:bg-white/[0.07] overflow-hidden">
                      <div className="h-full rounded-full bg-[#87102C]" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  {p.completed && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Completed ✓
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
