'use client';

import { History, Bookmark, Play, BookOpen, Loader2, CheckCircle2, Clock, Sparkles, Heart, MessageCircle, Layers, Mic2 } from 'lucide-react';
import {
  useMemberSermonHistory,
  useMemberSermonBookmarks,
  useMemberSermonStats,
  usePublishedSermons,
  type MemberHistoryEntry,
  type MemberBookmarkEntry,
} from '@/lib/api';
import { useSermonPlayer } from '@/context/SermonPlayerContext';
import { formatSermonDuration } from '@/lib/api/sermon-types';
import SermonBrowseGrid from '@/components/sermons/SermonBrowseGrid';
import type { LatestSermon } from '@/types';

/* ── Overview stat card — matches the StatCard pattern used across the dashboard ────── */
function StatTile({
  label, value, icon, iconBg, iconColor, loading,
}: {
  label: string; value: number; icon: React.ReactNode; iconBg: string; iconColor: string; loading: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700/60 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
      )}
    </div>
  );
}

function OverviewStats() {
  const { data: stats, isLoading: statsLoading } = useMemberSermonStats();
  const { data: sermons, isLoading: sermonsLoading } = usePublishedSermons();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatTile
        label="Completed" value={stats?.completed ?? 0} loading={statsLoading}
        icon={<CheckCircle2 size={14} />} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatTile
        label="In Progress" value={stats?.inProgress ?? 0} loading={statsLoading}
        icon={<Clock size={14} />} iconBg="bg-amber-50 dark:bg-amber-500/10" iconColor="text-amber-600 dark:text-amber-400"
      />
      <StatTile
        label="Saved" value={stats?.bookmarked ?? 0} loading={statsLoading}
        icon={<Bookmark size={14} />} iconBg="bg-[#87102C]/10 dark:bg-[#87102C]/15" iconColor="text-[#87102C] dark:text-[#e8768a]"
      />
      <StatTile
        label="Available" value={sermons?.length ?? 0} loading={sermonsLoading}
        icon={<BookOpen size={14} />} iconBg="bg-sky-50 dark:bg-sky-500/10" iconColor="text-sky-600 dark:text-sky-400"
      />
    </div>
  );
}

/* ── Shelf card — horizontal-scroll card shared by Continue/Saved/Recent rows ──────── */
function ShelfCard({
  sermon,
  onPlay,
  progressPct,
  badge,
}: {
  sermon: LatestSermon;
  onPlay: (slug: string) => void;
  progressPct?: number;
  badge?: React.ReactNode;
}) {
  const isSeries = sermon.type === 'SERIES' || !!sermon.series;
  const duration = formatSermonDuration(sermon.audioDuration);

  return (
    <button type="button" onClick={() => onPlay(sermon.slug)} className="group w-56 shrink-0 text-left">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
        {sermon.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sermon.thumbnailUrl} alt={sermon.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#87102C]/10 to-[#87102C]/5 dark:from-[#87102C]/20 dark:to-transparent flex items-center justify-center">
            <BookOpen size={26} className="text-[#87102C]/30 dark:text-[#87102C]/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-white/95 text-[#87102C] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all shadow-lg">
            <Play size={15} fill="currentColor" />
          </div>
        </div>
        <span
          className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm ${
            isSeries ? 'bg-[#87102C]/85 text-white' : 'bg-black/60 text-white'
          }`}
        >
          {isSeries ? <Layers size={9} /> : <Mic2 size={9} />}
          {isSeries ? 'Series' : 'Single'}
        </span>
        {badge && <div className="absolute top-2 left-2">{badge}</div>}
        {progressPct !== undefined && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-black/25">
            <div className="h-full bg-[#87102C]" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
      <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors">
        {sermon.title}
      </p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
        {sermon.speaker}
        {progressPct !== undefined ? ` · ${progressPct}% complete` : ''}
      </p>
      <div className="flex items-center gap-2.5 text-[11px] text-gray-400 dark:text-gray-500 mt-1">
        {duration && (
          <span className="flex items-center gap-0.5">
            <Clock size={10} /> {duration}
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <Heart size={10} /> {sermon._count?.SermonReaction ?? 0}
        </span>
        <span className="flex items-center gap-0.5">
          <MessageCircle size={10} /> {sermon._count?.SermonComment ?? 0}
        </span>
      </div>
    </button>
  );
}

function Shelf({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
        {icon} {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">{children}</div>
    </section>
  );
}

function ContinueListeningShelf({ onPlay }: { onPlay: (slug: string) => void }) {
  const { data: history, isLoading } = useMemberSermonHistory();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
        <Loader2 size={13} className="animate-spin" /> Loading your history…
      </div>
    );
  }
  const inProgress = (history ?? []).filter((h: MemberHistoryEntry) => !h.completed);
  if (inProgress.length === 0) return null;

  return (
    <Shelf title="Continue Listening" icon={<History size={14} className="text-[#87102C] dark:text-[#e8768a]" />}>
      {inProgress.map((h) => {
        const pct = h.Sermon.audioDuration
          ? Math.min(100, Math.round((h.positionSec / h.Sermon.audioDuration) * 100))
          : 0;
        return <ShelfCard key={h.id} sermon={h.Sermon} onPlay={onPlay} progressPct={pct} />;
      })}
    </Shelf>
  );
}

function SavedShelf({ onPlay }: { onPlay: (slug: string) => void }) {
  const { data: bookmarks, isLoading } = useMemberSermonBookmarks();

  if (isLoading || !bookmarks || bookmarks.length === 0) return null;

  return (
    <Shelf title="Saved for Later" icon={<Bookmark size={14} className="text-[#87102C] dark:text-[#e8768a]" />}>
      {bookmarks.map((b: MemberBookmarkEntry) => (
        <ShelfCard
          key={b.id}
          sermon={b.Sermon}
          onPlay={onPlay}
          badge={
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-amber-400">
              <Bookmark size={10} fill="currentColor" />
            </span>
          }
        />
      ))}
    </Shelf>
  );
}

function RecentlyAddedShelf({ onPlay }: { onPlay: (slug: string) => void }) {
  const { data: sermons, isLoading } = usePublishedSermons();

  if (isLoading || !sermons || sermons.length === 0) return null;

  const recent = [...sermons]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <Shelf title="Recently Added" icon={<Sparkles size={14} className="text-[#87102C] dark:text-[#e8768a]" />}>
      {recent.map((s) => (
        <ShelfCard key={s.id} sermon={s} onPlay={onPlay} />
      ))}
    </Shelf>
  );
}

export default function Member() {
  const { play } = useSermonPlayer();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">My Sermons</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Pick up where you left off, revisit what you've saved, or explore the full library — everything plays right here.
        </p>
      </div>

      <OverviewStats />

      <ContinueListeningShelf onPlay={play} />
      <SavedShelf onPlay={play} />
      <RecentlyAddedShelf onPlay={play} />

      <div className="pt-2 border-t border-gray-100 dark:border-white/8">
        <div className="pt-6">
          <SermonBrowseGrid
            onPlay={play}
            heading="Full Library"
            subheading="Every published message — search, filter, and play without leaving this page."
            detailsHref={(slug) => `/dashboard/sermon/${slug}`}
            detailsLabel="View Details"
          />
        </div>
      </div>
    </div>
  );
}
