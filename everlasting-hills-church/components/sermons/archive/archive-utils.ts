import type { LatestSermon } from '@/types';

export const PAGE = 8;

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function metaLine(s: LatestSermon) {
  return [s.speaker, fmtDate(s.date), s.scriptureRef].filter(Boolean).join(' · ');
}

export type SeriesGroup = { name: string; slug: string; items: LatestSermon[] };
