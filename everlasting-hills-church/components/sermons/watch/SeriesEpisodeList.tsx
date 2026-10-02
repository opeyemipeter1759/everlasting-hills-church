'use client';

import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import { useSermonPlayer } from '@/context/SermonPlayerContext';
import { formatSermonDuration, type WatchSermon } from '@/lib/api/sermon-types';

/** "Series Title - Part 2" reads as just "Part 2" under the series' own heading. */
function shortTitle(episodeTitle: string, seriesTitle: string): string {
  const prefix = seriesTitle.trim().toLowerCase();
  const title = episodeTitle.trim();
  if (!title.toLowerCase().startsWith(prefix)) return title;
  const rest = title.slice(prefix.length).replace(/^\s*[-–—:|]\s*/, '').trim();
  return rest || title;
}

/**
 * A series' parts as a quiet track list: one card, hairline rows, the number and
 * running time doing the work rather than colour. The part playing is marked by
 * an accent rule and a pause glyph, not a filled pill.
 */
export default function SeriesEpisodeList({ sermon }: { sermon: WatchSermon }) {
  const { play, activeSlug, activeEpisodeId } = useSermonPlayer();
  const episodes = sermon.episodes;
  if (episodes.length === 0) return null;

  const isPlayingHere = activeSlug === sermon.slug;
  const currentId = isPlayingHere ? activeEpisodeId ?? episodes[0].id : null;
  const total = formatSermonDuration(episodes.reduce((sum, e) => sum + (e.duration || 0), 0));

  return (
    <section aria-labelledby="episodes-heading" className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] overflow-hidden">
      <header className="flex items-center justify-between gap-4 px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-white/[0.08]">
        <div className="min-w-0">
          <h2 id="episodes-heading" className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
            Episodes
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {episodes.length} {episodes.length === 1 ? 'part' : 'parts'}
            {total && <> · {total} in total</>}
          </p>
        </div>
        {!isPlayingHere && (
          <button
            type="button"
            onClick={() => play(sermon.slug, episodes[0].id)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 transition-colors"
          >
            <Play size={12} fill="currentColor" /> Play from Part 1
          </button>
        )}
      </header>

      <ol className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {episodes.map((ep, i) => {
          const isCurrent = currentId === ep.id;
          const cover = ep.thumbnailUrl || sermon.thumbnailUrl;
          return (
            <li key={ep.id} className="relative">
              {isCurrent && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[#87102C] dark:bg-[#e8768a]" />}
              <button
                type="button"
                onClick={() => play(sermon.slug, ep.id)}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={`Play part ${i + 1}: ${ep.title}`}
                className={`group flex w-full items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 text-left transition-colors ${
                  isCurrent ? 'bg-gray-50 dark:bg-white/[0.04]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                }`}
              >
                <span className="w-5 shrink-0 text-right text-sm tabular-nums text-gray-400 dark:text-gray-500">
                  {isCurrent ? (
                    <Pause size={14} className="ml-auto text-[#87102C] dark:text-[#e8768a]" fill="currentColor" />
                  ) : (
                    <>
                      <span className="group-hover:hidden">{i + 1}</span>
                      <Play size={14} className="ml-auto hidden text-gray-700 dark:text-gray-200 group-hover:block" fill="currentColor" />
                    </>
                  )}
                </span>
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                  {cover && <Image src={cover} alt="" fill sizes="44px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-medium ${
                      isCurrent ? 'text-[#87102C] dark:text-[#e8768a]' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {shortTitle(ep.title, sermon.title)}
                  </span>
                  {isCurrent && <span className="block text-xs text-[#87102C]/80 dark:text-[#e8768a]/80">Now playing</span>}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500">
                  {formatSermonDuration(ep.duration)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
