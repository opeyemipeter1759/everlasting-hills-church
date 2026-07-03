'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Play, BookOpen, Headphones, Video, Layers, Mic2, ArrowLeft, Clock, Heart, MessageCircle } from 'lucide-react';
import { usePublishedSermons } from '@/lib/api';
import { formatSermonDuration } from '@/lib/api/sermon-types';
import type { LatestSermon } from '@/types';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Series vs Single badge — shown on every card so members know if there's more to a message. */
function TypeBadge({ s }: { s: LatestSermon }) {
  const isSeries = s.type === 'SERIES' || !!s.series;
  return (
    <span
      className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
        isSeries ? 'bg-[#87102C]/85 text-white' : 'bg-black/60 text-white'
      }`}
    >
      {isSeries ? <Layers size={10} /> : <Mic2 size={10} />}
      {isSeries ? 'Series' : 'Single'}
    </span>
  );
}

/** Duration · reactions · comments — the stats a member sees before deciding to play. */
function CardStats({ s }: { s: LatestSermon }) {
  const duration = formatSermonDuration(s.audioDuration);
  return (
    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
      {duration && (
        <span className="flex items-center gap-1">
          <Clock size={11} /> {duration}
        </span>
      )}
      {s.audioUrl && (
        <span className="flex items-center gap-1">
          <Headphones size={11} /> {s.playCount}
        </span>
      )}
      <span className="flex items-center gap-1">
        <Heart size={11} /> {s._count?.SermonReaction ?? 0}
      </span>
      <span className="flex items-center gap-1">
        <MessageCircle size={11} /> {s._count?.SermonComment ?? 0}
      </span>
    </div>
  );
}

function SermonCard({
  s, onPlay, detailsHref, detailsLabel,
}: {
  s: LatestSermon;
  onPlay: (slug: string) => void;
  detailsHref: (slug: string) => string;
  detailsLabel: string;
}) {
  return (
    <div className="group bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-[#87102C]/30 hover:shadow-md transition-all duration-200 flex flex-col">
      <button
        type="button"
        onClick={() => onPlay(s.slug)}
        className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-white/5 block w-full"
        aria-label={`Play ${s.title}`}
      >
        {s.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#87102C]/10 to-[#87102C]/5 dark:from-[#87102C]/20 dark:to-transparent flex items-center justify-center">
            <BookOpen size={32} className="text-[#87102C]/30 dark:text-[#87102C]/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-white/95 text-[#87102C] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all shadow-lg">
            <Play size={18} fill="currentColor" />
          </div>
        </div>
        {s.videoUrl && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <Video size={10} /> Video
          </span>
        )}
        <TypeBadge s={s} />
      </button>
      <div className="p-5 flex flex-col gap-2 flex-1">
        {s.series && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">{s.series}</p>
        )}
        <button type="button" onClick={() => onPlay(s.slug)} className="text-left">
          <h3 className="font-bold text-gray-900 dark:text-white leading-snug group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors">
            {s.title}
          </h3>
        </button>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {s.speaker} · {fmtDate(s.date)}
          {s.scriptureRef && ` · ${s.scriptureRef}`}
        </p>
        {s.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">{s.description}</p>
        )}
        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-gray-100 dark:border-white/8">
          <CardStats s={s} />
          <span className="ml-auto shrink-0">
            <Link
              href={detailsHref(s.slug)}
              className="text-xs font-semibold text-gray-400 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
            >
              {detailsLabel} →
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

function SermonRow({ s, onPlay }: { s: LatestSermon; onPlay: (slug: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPlay(s.slug)}
      className="group w-full flex gap-4 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:border-[#87102C]/30 hover:shadow-sm transition-all text-left"
    >
      {s.thumbnailUrl ? (
        <div className="relative w-24 sm:w-32 aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
            <Play size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
          </div>
        </div>
      ) : (
        <div className="w-24 sm:w-32 aspect-video rounded-lg bg-gradient-to-br from-[#87102C]/10 to-[#87102C]/5 dark:from-[#87102C]/20 dark:to-transparent flex items-center justify-center flex-shrink-0">
          <Play size={18} className="text-[#87102C]/40" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3 className="font-bold text-gray-900 dark:text-white leading-snug group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors line-clamp-2">
          {s.title}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {s.speaker} · {fmtDate(s.date)}
          {s.scriptureRef && ` · ${s.scriptureRef}`}
        </p>
        {s.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{s.description}</p>
        )}
        <div className="mt-auto pt-1">
          <CardStats s={s} />
        </div>
      </div>
    </button>
  );
}

type SeriesGroup = { name: string; slug: string; items: LatestSermon[] };

function SeriesCard({ g, onOpen }: { g: SeriesGroup; onOpen: (g: SeriesGroup) => void }) {
  const cover = g.items.find((i) => i.thumbnailUrl)?.thumbnailUrl;
  return (
    <button
      type="button"
      onClick={() => onOpen(g)}
      className="group bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-[#87102C]/30 hover:shadow-md transition-all duration-200 flex flex-col text-left"
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-white/5">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#87102C]/10 to-[#87102C]/5 dark:from-[#87102C]/20 dark:to-transparent flex items-center justify-center">
            <Layers size={32} className="text-[#87102C]/30 dark:text-[#87102C]/40" />
          </div>
        )}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <Layers size={10} /> Series
        </span>
      </div>
      <div className="p-5 flex flex-col gap-1.5">
        <h3 className="font-bold text-gray-900 dark:text-white leading-snug group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors">
          {g.name}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {g.items.length} message{g.items.length !== 1 ? 's' : ''} · newest {fmtDate(g.items[0].date)}
        </p>
      </div>
    </button>
  );
}

function SeriesDetailView({ group, onBack, onPlay }: { group: SeriesGroup; onBack: () => void; onPlay: (slug: string) => void }) {
  const sorted = [...group.items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Series
      </button>
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-[#87102C] dark:text-[#e8768a]" />
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{group.name}</h2>
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500 -mt-3">
        {sorted.length} message{sorted.length !== 1 ? 's' : ''} in this series
      </p>
      <div className="space-y-3">
        {sorted.map((s) => (
          <SermonRow key={s.id} s={s} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { id: 'all', label: 'All', icon: BookOpen },
  { id: 'singles', label: 'Singles', icon: Mic2 },
  { id: 'series', label: 'Series', icon: Layers },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function SermonBrowseGrid({
  onPlay,
  heading = 'Sermon Archive',
  subheading = 'Browse every message — tap play to listen or watch right here, no page reload needed.',
  detailsHref = (slug) => `/dashboard/sermon/${slug}`,
  detailsLabel = 'Open page',
}: {
  onPlay: (slug: string) => void;
  heading?: string;
  subheading?: string;
  /** Where the card's secondary link goes — defaults to the public sermon page. */
  detailsHref?: (slug: string) => string;
  detailsLabel?: string;
}) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabId>('all');
  const [openSeries, setOpenSeries] = useState<SeriesGroup | null>(null);

  const { data: sermons, isLoading } = usePublishedSermons({
    ...(search.trim() && { search: search.trim() }),
  });

  const { singles, seriesGroups } = useMemo(() => {
    const singles: LatestSermon[] = [];
    const map = new Map<string, SeriesGroup>();
    (sermons ?? []).forEach((s) => {
      if (s.series && s.seriesSlug) {
        const g = map.get(s.seriesSlug) ?? { name: s.series, slug: s.seriesSlug, items: [] };
        g.items.push(s);
        map.set(s.seriesSlug, g);
      } else {
        singles.push(s);
      }
    });
    return { singles, seriesGroups: Array.from(map.values()) };
  }, [sermons]);

  const visible = tab === 'singles' ? singles : sermons ?? [];
  const count = tab === 'series' ? seriesGroups.length : visible.length;

  if (openSeries) {
    return <SeriesDetailView group={openSeries} onBack={() => setOpenSeries(null)} onPlay={onPlay} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{heading}</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{subheading}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, speaker, or scripture…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
          />
        </div>

        <div className="inline-flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-white/5 p-1 w-fit">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-white dark:bg-[#2a2a2e] text-[#87102C] dark:text-[#e8768a] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {!isLoading && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {count} {tab === 'series' ? `series` : `sermon${count !== 1 ? 's' : ''}`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-white/5" />
              <div className="p-5 space-y-2">
                <div className="h-3 w-20 bg-gray-100 dark:bg-white/5 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 dark:bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : count === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-gray-400">No sermons match your search.</p>
        </div>
      ) : tab === 'series' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {seriesGroups.map((g) => (
            <SeriesCard key={g.slug} g={g} onOpen={setOpenSeries} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((s) => (
            <SermonCard key={s.id} s={s} onPlay={onPlay} detailsHref={detailsHref} detailsLabel={detailsLabel} />
          ))}
        </div>
      )}
    </div>
  );
}
