"use client";

import Link from "next/link";
import { Headphones, Heart, Bookmark, Mail, Play, BarChart2 } from "lucide-react";

type TopSermon = {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  playCount: number;
  series: string | null;
  _count: { reactions: number; bookmarks: number };
};

type Props = {
  topSermons: TopSermon[];
  totalSubscribers: number;
  totalReactions: number;
  totalBookmarks: number;
  totalListens: number;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatBadge({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</span>
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      </div>
      <p className="text-3xl font-black text-gray-900 dark:text-white">{value.toLocaleString()}</p>
    </div>
  );
}

export default function SermonAnalytics({ topSermons, totalSubscribers, totalReactions, totalBookmarks, totalListens }: Props) {
  const maxPlays = Math.max(...topSermons.map((s) => s.playCount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">Sermon Analytics</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Engagement across all published messages</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBadge label="Total Listens" value={totalListens} icon={<Headphones size={16} />} />
        <StatBadge label="Reactions" value={totalReactions} icon={<Heart size={16} />} />
        <StatBadge label="Bookmarks" value={totalBookmarks} icon={<Bookmark size={16} />} />
        <StatBadge label="Subscribers" value={totalSubscribers} icon={<Mail size={16} />} />
      </div>

      {/* Top sermons */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <BarChart2 size={15} className="text-[#87102C]" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Top Messages by Play Count</h2>
        </div>

        {topSermons.length === 0 ? (
          <div className="py-16 text-center">
            <BarChart2 size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-400 dark:text-gray-500">No published sermons yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/8">
            {topSermons.map((s, i) => {
              const barW = maxPlays > 0 ? (s.playCount / maxPlays) * 100 : 0;
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <span className="w-6 text-xs font-black text-gray-300 dark:text-gray-600 flex-shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/sermons/${s.slug}`} target="_blank"
                        className="text-sm font-bold text-gray-900 dark:text-white hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors line-clamp-1">
                        {s.title}
                      </Link>
                      {s.series && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a]">
                          {s.series}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                      {s.speaker} · {fmtDate(s.date)}
                    </p>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#87102C]"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right space-y-0.5">
                    <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1 justify-end">
                      <Play size={11} fill="currentColor" className="text-[#87102C]" /> {s.playCount}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 justify-end">
                      <Heart size={10} /> {s._count.reactions}
                      <span className="ml-1"><Bookmark size={10} /> {s._count.bookmarks}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
