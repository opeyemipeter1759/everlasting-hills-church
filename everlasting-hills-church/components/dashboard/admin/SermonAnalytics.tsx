"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Headphones,
  Heart,
  Bookmark,
  Mail,
  Play,
  BarChart2,
  Search,
  ChevronUp,
  ChevronDown,
  ThumbsUp,
  Hand,
  Flame,
  MessageSquare,
  StickyNote,
  MessagesSquare,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

type SermonRow = {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  date: string;
  playCount: number;
  series: string | null;
  reactions: number;
  bookmarks: number;
  comments: number;
  notes: number;
  listens: number;
  reactionsByType: { LIKE: number; AMEN: number; CONVICTED: number };
  completedListens: number;
  completionRate: number;
  discussion: { questionCount: number; responseCount: number; questionsWithResponses: number };
};

type Props = {
  sermons: SermonRow[];
  totalSubscribers: number;
  totalReactions: number;
  totalBookmarks: number;
  totalListens: number;
};

type SortCol = "plays" | "reactions" | "comments" | "completion" | "discussion" | "title";

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

export default function SermonAnalytics({ sermons, totalSubscribers, totalReactions, totalBookmarks, totalListens }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ col: SortCol; dir: "asc" | "desc" }>({ col: "plays", dir: "desc" });

  const maxPlays = Math.max(...sermons.map((s) => s.playCount), 1);
  const totalComments = sermons.reduce((n, s) => n + s.comments, 0);
  const sermonsWithListens = sermons.filter((s) => s.listens > 0);
  const avgCompletion =
    sermonsWithListens.length > 0
      ? sermonsWithListens.reduce((n, s) => n + s.completionRate, 0) / sermonsWithListens.length
      : 0;

  const doSort = (col: SortCol) => setSort((s) => ({ col, dir: s.col === col && s.dir === "desc" ? "asc" : "desc" }));

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = term
      ? sermons.filter(
          (s) =>
            s.title.toLowerCase().includes(term) ||
            s.speaker.toLowerCase().includes(term) ||
            (s.series ?? "").toLowerCase().includes(term)
        )
      : sermons;

    const sorted = [...filtered].sort((a, b) => {
      let diff = 0;
      switch (sort.col) {
        case "title":
          diff = a.title.localeCompare(b.title);
          break;
        case "reactions":
          diff = a.reactions - b.reactions;
          break;
        case "comments":
          diff = a.comments - b.comments;
          break;
        case "completion":
          diff = a.completionRate - b.completionRate;
          break;
        case "discussion":
          diff = a.discussion.responseCount - b.discussion.responseCount;
          break;
        case "plays":
        default:
          diff = a.playCount - b.playCount;
      }
      return sort.dir === "asc" ? diff : -diff;
    });

    return sorted;
  }, [sermons, q, sort]);

  function TH({ col, label, className = "" }: { col: SortCol; label: string; className?: string }) {
    const active = sort.col === col;
    return (
      <th
        onClick={() => doSort(col)}
        className={`px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-white select-none whitespace-nowrap ${className}`}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (sort.dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Sermon Analytics</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Engagement across all published messages</p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
          {sermons.length} published
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatBadge label="Total Listens" value={totalListens} icon={<Headphones size={16} />} />
        <StatBadge label="Reactions" value={totalReactions} icon={<Heart size={16} />} />
        <StatBadge label="Bookmarks" value={totalBookmarks} icon={<Bookmark size={16} />} />
        <StatBadge label="Comments" value={totalComments} icon={<MessageSquare size={16} />} />
        <StatBadge label="Subscribers" value={totalSubscribers} icon={<Mail size={16} />} />
        <StatBadge label="Avg Completion" value={Math.round(avgCompletion * 100)} icon={<CheckCircle2 size={16} />} />
      </div>

      {/* Sermon engagement table */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <div className="flex items-center gap-2">
            <BarChart2 size={15} className="text-[#87102C]" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Sermon Performance</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, speaker, series…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#87102C]/25"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <BarChart2 size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-400 dark:text-gray-500">{sermons.length === 0 ? "No published sermons yet." : "No sermons match your search."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead className="bg-gray-50/70 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 w-8">#</th>
                  <TH col="title" label="Sermon" className="min-w-[220px]" />
                  <TH col="plays" label="Plays" />
                  <TH col="reactions" label="Reactions" />
                  <TH col="comments" label="Comments" />
                  <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Notes</th>
                  <TH col="discussion" label="Discussion" />
                  <TH col="completion" label="Completion" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/8">
                {rows.map((s, i) => {
                  const barW = maxPlays > 0 ? (s.playCount / maxPlays) * 100 : 0;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/dashboard/pastor/sermons/${s.id}/analytics`)}
                      className="cursor-pointer hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors align-top"
                    >
                      <td className="px-3 py-3 text-xs font-black text-gray-300 dark:text-gray-600">{i + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{s.title}</span>
                          {s.series && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a]">
                              {s.series}
                            </span>
                          )}
                          <Link
                            href={`/sermons/${s.slug}`}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            title="View public page"
                            className="text-gray-300 dark:text-gray-600 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
                          >
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {s.speaker} · {fmtDate(s.date)}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1 mb-1.5">
                          <Play size={11} fill="currentColor" className="text-[#87102C]" /> {s.playCount}
                        </p>
                        <div className="h-1.5 w-24 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-[#87102C]" style={{ width: `${barW}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1.5"><ThumbsUp size={10} className="text-blue-500" /> {s.reactionsByType.LIKE}</span>
                          <span className="flex items-center gap-1.5"><Hand size={10} className="text-amber-500" /> {s.reactionsByType.AMEN}</span>
                          <span className="flex items-center gap-1.5"><Flame size={10} className="text-[#87102C]" /> {s.reactionsByType.CONVICTED}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <MessageSquare size={11} className="text-gray-400" /> {s.comments}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <StickyNote size={11} className="text-gray-400" /> {s.notes}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {s.discussion.questionCount > 0 ? (
                          <>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <MessagesSquare size={11} className="text-gray-400" />
                              {s.discussion.questionsWithResponses}/{s.discussion.questionCount} answered
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{s.discussion.responseCount} responses</p>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-300 dark:text-gray-600">No questions</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {s.listens > 0 ? (
                          <>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{Math.round(s.completionRate * 100)}%</p>
                            <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden mt-1">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.completionRate * 100}%` }} />
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{s.completedListens}/{s.listens} finished</p>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-300 dark:text-gray-600">No listens yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
