'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Chevron, PrimaryButton } from './ArchiveUi';
import { fmtDate, metaLine, type SeriesGroup } from './archive-utils';

/** One series: name + count line, Play latest and a chevron; expands to its messages. */
export default function SeriesRow({ g, onPlay }: { g: SeriesGroup; onPlay: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const newest = g.items[0];

  return (
    <div className={`rounded-lg border bg-white dark:bg-[#1c1c1e] ${open ? 'border-gray-300 shadow-sm dark:border-white/15' : 'border-gray-200 dark:border-white/10'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{g.name}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
            {g.items.length} message{g.items.length !== 1 ? 's' : ''} · newest {fmtDate(newest.date)}
          </p>
        </button>
        <PrimaryButton onClick={() => onPlay(newest.slug)}>
          <Play size={11} fill="currentColor" /> Latest
        </PrimaryButton>
        <Chevron open={open} onClick={() => setOpen((o) => !o)} label={open ? 'Hide messages' : 'Show messages'} />
      </div>

      {open && (
        <div className="px-4 pb-4">
          <ol className="overflow-hidden rounded-2xl bg-[#F1F1F1] dark:bg-white/5">
            {g.items.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 border-b border-gray-200 px-5 py-3 last:border-b-0 dark:border-white/10">
                <span className="w-5 flex-shrink-0 text-xs font-medium text-gray-400">{g.items.length - i}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gray-800 dark:text-gray-100">{s.title}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{metaLine(s)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onPlay(s.slug)}
                  aria-label={`Play ${s.title}`}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-[#87102C] transition-colors hover:border-[#87102C] dark:border-white/15 dark:bg-white/5 dark:text-rose-300"
                >
                  <Play size={11} fill="currentColor" />
                </button>
              </li>
            ))}
          </ol>
          <Link
            href={`/sermons/series/${g.slug}`}
            className="mt-3 inline-block text-xs font-medium text-gray-500 transition-colors hover:text-[#87102C] dark:text-gray-400 dark:hover:text-rose-300"
          >
            Open series page →
          </Link>
        </div>
      )}
    </div>
  );
}
