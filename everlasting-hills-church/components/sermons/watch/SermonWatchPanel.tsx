'use client';

import { useEffect, useRef } from 'react';
import { Play, BookOpen } from 'lucide-react';
import SermonEngagementContent from './SermonEngagementContent';
import { useSermonPlayer } from '@/context/SermonPlayerContext';
import { useIncrementSermonPlay } from '@/lib/api';
import type { MemberSermonContext, WatchSermon } from '@/lib/api/sermon-types';

function getYouTubeEmbedUrl(url: string) {
  if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com')) return url;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=0`;
  return url;
}

/**
 * Full /sermons/[slug] watch page. Video plays inline here; audio hands off to the global
 * SermonPlayerBar (mounted in the public layout) so listening keeps going if the visitor
 * navigates elsewhere — this page never mounts its own <audio> element.
 */
export default function SermonWatchPanel({
  sermon,
  memberCtx,
  isLoggedIn,
}: {
  sermon: WatchSermon;
  memberCtx: MemberSermonContext | null;
  isLoggedIn: boolean;
}) {
  const { play, activeSlug } = useSermonPlayer();
  const playCounted = useRef(false);
  const incrementPlay = useIncrementSermonPlay();

  // Video sermons have no reliable in-app "play" event without the YouTube postMessage API,
  // so we count the view when the page opens instead of waiting for an explicit play click.
  useEffect(() => {
    if (sermon.videoUrl && !sermon.audioUrl && !playCounted.current) {
      playCounted.current = true;
      incrementPlay.mutate(sermon.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sermon.id]);

  const isPlayingHere = activeSlug === sermon.slug;

  return (
    <div className="space-y-6">
      {sermon.videoUrl ? (
        <div className="aspect-video rounded-2xl overflow-hidden bg-black">
          <iframe
            src={getYouTubeEmbedUrl(sermon.videoUrl)}
            title={sermon.title}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : sermon.audioUrl ? (
        <button
          type="button"
          onClick={() => play(sermon.slug)}
          className="group relative w-full aspect-video sm:aspect-[21/9] rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5"
        >
          {sermon.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sermon.thumbnailUrl} alt={sermon.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#87102C]/10 to-[#87102C]/5 dark:from-[#87102C]/20 dark:to-transparent flex items-center justify-center">
              <BookOpen size={40} className="text-[#87102C]/30 dark:text-[#87102C]/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-white text-[#87102C] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
              <Play size={26} fill="currentColor" />
            </div>
          </div>
          {isPlayingHere && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#87102C] px-3 py-1 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Now Playing
            </span>
          )}
        </button>
      ) : null}

      <SermonEngagementContent sermon={sermon} memberCtx={memberCtx} isLoggedIn={isLoggedIn} />
    </div>
  );
}
