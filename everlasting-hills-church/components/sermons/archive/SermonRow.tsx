'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Headphones, Heart, MessageCircle, Play } from 'lucide-react';
import { formatSermonDuration } from '@/lib/api/sermon-types';
import type { LatestSermon } from '@/types';
import { Chevron, DetailRow, PrimaryButton } from './ArchiveUi';
import { fmtDate, metaLine } from './archive-utils';

/** One sermon: title + meta line, Play and a chevron; expands to an inset detail box. */
export default function SermonRow({
  s,
  onPlay,
  defaultOpen = false,
  primaryLabel = 'Play',
}: {
  s: LatestSermon;
  onPlay: (slug: string) => void;
  defaultOpen?: boolean;
  primaryLabel?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const duration = formatSermonDuration(s.audioDuration);

  return (
    <div className={`rounded-lg border bg-white transition-shadow dark:bg-[#1c1c1e] ${open ? 'border-gray-300 shadow-sm dark:border-white/15' : 'border-gray-200 dark:border-white/10'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{s.title}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{metaLine(s)}</p>
        </button>
        {!open && (
          <PrimaryButton onClick={() => onPlay(s.slug)}>
            <Play size={11} fill="currentColor" /> Play
          </PrimaryButton>
        )}
        <Chevron open={open} onClick={() => setOpen((o) => !o)} label={open ? 'Hide details' : 'Show details'} />
      </div>

      {open && (
        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-2xl bg-[#F1F1F1] dark:bg-white/5">
            <DetailRow label="Speaker" value={s.speaker} />
            <DetailRow label="Date" value={fmtDate(s.date)} />
            {s.scriptureRef && <DetailRow label="Scripture" value={s.scriptureRef} />}
            {s.series && <DetailRow label="Series" value={s.series} />}
            {s.description && (
              <p className="px-5 py-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{s.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 px-5 py-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {duration}
                </span>
              )}
              {s.audioUrl && (
                <span className="flex items-center gap-1">
                  <Headphones size={12} /> {s.playCount} plays
                </span>
              )}
              <span className="flex items-center gap-1">
                <Heart size={12} /> {s._count?.SermonReaction ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={12} /> {s._count?.SermonComment ?? 0}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <PrimaryButton onClick={() => onPlay(s.slug)}>
              <Play size={11} fill="currentColor" /> {primaryLabel}
            </PrimaryButton>
            <Link
              href={`/sermons/${s.slug}`}
              className="text-xs font-medium text-gray-500 transition-colors hover:text-[#87102C] dark:text-gray-400 dark:hover:text-rose-300"
            >
              Open sermon page →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

