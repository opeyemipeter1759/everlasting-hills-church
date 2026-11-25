'use client';

import { useMemo, useState } from 'react';
import { Icon, MagnifyingGlass, Play } from '@/components/icons';
import { usePublishedSermons } from '@/lib/api';
import type { LatestSermon } from '@/types';
import { Panel, PanelButton } from './archive/ArchiveUi';
import SermonRow from './archive/SermonRow';
import SeriesRow from './archive/SeriesRow';
import { PAGE, type SeriesGroup } from './archive/archive-utils';

/**
 * Public sermon archive laid out as stacked sections — each a soft panel with an
 * info-icon header, holding compact rows (title, one meta line, an action button
 * and a chevron that expands the row in place):
 *
 *   Latest message  → opened by default, details in an inset box + "Play message"
 *   Series          → each series expands to its messages
 *   Single messages → each sermon expands to its description, stats and page link
 */

export default function SermonArchiveSections({ onPlay }: { onPlay: (slug: string) => void }) {
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE);

  const { data: sermons, isLoading } = usePublishedSermons({
    ...(search.trim() && { search: search.trim() }),
  });

  const { latest, singles, seriesGroups } = useMemo(() => {
    const sorted = [...(sermons ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const singles: LatestSermon[] = [];
    const map = new Map<string, SeriesGroup>();
    sorted.forEach((s) => {
      // Only `type` decides series membership; `series` is also a topical label singles can carry.
      if (s.type === 'SERIES' && s.series && s.seriesSlug) {
        const g = map.get(s.seriesSlug) ?? { name: s.series, slug: s.seriesSlug, items: [] };
        g.items.push(s);
        map.set(s.seriesSlug, g);
      } else {
        singles.push(s);
      }
    });
    return { latest: sorted[0], singles, seriesGroups: Array.from(map.values()) };
  }, [sermons]);

  const searching = search.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Sermon archive</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tap play to listen right here — no page reload.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Icon icon={MagnifyingGlass} size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Search title, speaker, scripture…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 transition-all focus:border-[#87102C]/40 focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 dark:border-white/10 dark:bg-[#1c1c1e] dark:text-gray-200"
          />
        </div>
      </div>

      {isLoading ? (
        <Panel title="Loading sermons">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5" />
          ))}
        </Panel>
      ) : !latest ? (
        <Panel title={searching ? 'No matches' : 'No sermons yet'}>
          <p className="px-1 text-sm text-gray-500 dark:text-gray-400">
            {searching ? 'No sermons match your search. Try a different word.' : 'New messages will appear here after each service.'}
          </p>
        </Panel>
      ) : (
        <>
          {!searching && (
            <Panel
              title="Latest message"
              action={
                <PanelButton onClick={() => onPlay(latest.slug)}>
                  <Icon icon={Play} size={12} weight="fill" /> Play now
                </PanelButton>
              }
            >
              <SermonRow s={latest} onPlay={onPlay} defaultOpen primaryLabel="Play message" />
            </Panel>
          )}

          {seriesGroups.length > 0 && (
            <Panel title="Series" count={seriesGroups.length}>
              {seriesGroups.map((g) => (
                <SeriesRow key={g.slug} g={g} onPlay={onPlay} />
              ))}
            </Panel>
          )}

          {singles.length > 0 && (
            <Panel title={searching ? 'Results' : 'Single messages'} count={singles.length}>
              {singles.slice(0, shown).map((s) => (
                <SermonRow key={s.id} s={s} onPlay={onPlay} />
              ))}
              {singles.length > shown && (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE)}
                  className="w-full rounded-lg border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-[#87102C]/40 hover:text-[#87102C] dark:border-white/15 dark:text-gray-300"
                >
                  Show more ({singles.length - shown} left)
                </button>
              )}
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
