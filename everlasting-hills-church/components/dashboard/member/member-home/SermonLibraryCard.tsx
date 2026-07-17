import Link from "next/link";
import { Bookmark, ChevronRight, BookOpen } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { iconBg, iconCl, muted, linkCl } from "./tokens";
import { fmtShortDate } from "./helpers";
import { PanelCard } from "./Primitives";

export function SermonLibraryCard({ sermonStreak, bookmarks }: {
  sermonStreak: number;
  bookmarks: MemberHomeProps["bookmarks"];
}) {
  return (
    <PanelCard
      kicker="My Library"
      title="Saved Sermons"
      icon={Bookmark}
      action={
        <Link href="/sermons" className={linkCl}>Browse <ChevronRight size={12} /></Link>
      }
    >
      {sermonStreak > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
          <span className="text-2xl" aria-hidden="true">🔥</span>
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {sermonStreak}-week listening streak!
            </p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 mt-0.5">
              Listen to a new sermon this week to keep it going.
            </p>
          </div>
        </div>
      )}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
          <span className={`${iconBg} !w-11 !h-11 !rounded-xl`}>
            <Bookmark size={18} className={iconCl} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">No saved sermons yet</p>
            <Link href="/sermons" className={`${linkCl} justify-center mt-1`}>
              Browse the archive <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {bookmarks.slice(0, 5).map((b) => (
            <Link key={b.slug} href={`/sermons/${b.slug}`}
              className="flex gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition-colors group">
              {b.thumbnailUrl ? (
                <img src={b.thumbnailUrl} alt={b.title} className="w-12 aspect-video rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 aspect-video rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={12} className={iconCl} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#111] dark:text-white group-hover:text-[#87102C] dark:group-hover:text-[#FFB3C1] transition-colors line-clamp-1">{b.title}</p>
                <p className={`text-[10px] ${muted} mt-0.5`}>{b.speaker} · {fmtShortDate(b.date)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PanelCard>
  );
}
