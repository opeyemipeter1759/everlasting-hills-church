'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, X, ChevronUp, ChevronDown, RotateCcw, RotateCw, Loader2, Video as VideoIcon,
} from 'lucide-react';
import SermonEngagementContent from './SermonEngagementContent';
import { useSermonBySlug, useSermonMemberContext, useSermonProgress, useIncrementSermonPlay } from '@/lib/api';
import { getFrontendSessionUser } from '@/lib/auth/frontend-session';
import { toWatchSermon } from '@/lib/api/sermon-types';

function fmtTime(s: number) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function getYouTubeEmbedUrl(url: string) {
  if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com')) return url;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  return url;
}

/**
 * Spotify-style persistent bottom player. Pressing Play on a card never opens an overlay —
 * this bar docks at the bottom and keeps playing while the visitor keeps browsing the grid.
 * Tapping the bar (not its transport buttons) slides up a drawer with reactions/comments/
 * notes/reflection; collapsing it never stops playback since the <audio> element lives here,
 * not inside the drawer content.
 */
export default function SermonPlayerBar({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data: raw, isLoading } = useSermonBySlug(slug);
  const session = getFrontendSessionUser();
  const isLoggedIn = !!session?.loggedIn;
  const { data: memberCtx } = useSermonMemberContext(raw?.id, isLoggedIn);
  const saveProgress = useSermonProgress();
  const incrementPlay = useIncrementSermonPlay();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressSavedAt = useRef(0);
  const playCounted = useRef(false);
  const seededPosition = useRef(false);

  const sermon = raw ? toWatchSermon(raw) : null;

  function countPlayOnce() {
    if (playCounted.current || !sermon) return;
    playCounted.current = true;
    incrementPlay.mutate(sermon.id);
  }

  // Seed the saved listening position once metadata is known, then start playing — pressing
  // Play on a card should start the sermon immediately, not just load it into the bar.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !sermon?.audioUrl || seededPosition.current) return;
    const onLoaded = () => {
      const pos = memberCtx?.progress?.positionSec ?? 0;
      if (pos > 0 && pos < audio.duration - 5) audio.currentTime = pos;
      setDuration(audio.duration || 0);
      seededPosition.current = true;
      audio.play().catch(() => {});
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    return () => audio.removeEventListener('loadedmetadata', onLoaded);
  }, [sermon?.audioUrl, memberCtx?.progress?.positionSec]);

  // Video sermons have no <audio> to autoplay — expand the drawer straight away instead so
  // picking a video sermon also "starts playing" immediately rather than sitting collapsed.
  useEffect(() => {
    seededPosition.current = false;
    playCounted.current = false;
    progressSavedAt.current = 0;
    if (sermon?.videoUrl && !sermon.audioUrl) {
      countPlayOnce();
      setExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sermon?.id]);

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio || !sermon) return;
    setCurrent(audio.currentTime);
    if (audio.currentTime - progressSavedAt.current > 10) {
      progressSavedAt.current = audio.currentTime;
      const completed = audio.duration > 0 && audio.currentTime / audio.duration > 0.9;
      if (isLoggedIn) saveProgress.mutate({ sermonId: sermon.id, positionSec: Math.floor(audio.currentTime), completed });
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play().catch(() => {});
  }

  function skip(delta: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta));
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const isVideo = !!sermon?.videoUrl;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* ── Expanded drawer ─────────────────────────────────────────── */}
      {expanded && (
        <div
          className="absolute inset-x-0 bottom-full max-h-[82vh] overflow-y-auto rounded-t-2xl border-t border-x border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 dark:bg-[#141414]/95 backdrop-blur border-b border-gray-100 dark:border-white/8">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <ChevronDown size={16} /> Minimize
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close player"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto">
            {isLoading || !sermon ? (
              <div className="flex justify-center py-16">
                <Loader2 size={22} className="animate-spin text-[#87102C]" />
              </div>
            ) : (
              <div className="space-y-6">
                {isVideo && (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(sermon.videoUrl!)}
                      title={sermon.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                )}
                <SermonEngagementContent sermon={sermon} memberCtx={memberCtx ?? null} isLoggedIn={isLoggedIn} compact />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Collapsed mini-bar ──────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
        {!isVideo && (
          <div className="h-[3px] w-full bg-gray-100 dark:bg-white/5">
            <div className="h-full bg-[#87102C] transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        )}
        <audio
          ref={audioRef}
          src={sermon?.audioUrl ?? undefined}
          preload="metadata"
          onPlay={() => { setPlaying(true); countPlayOnce(); }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={handleTimeUpdate}
          className="hidden"
        />

        <div className="flex items-center gap-3 px-3 sm:px-5 py-2.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            {sermon?.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sermon.thumbnailUrl} alt="" className="h-11 w-11 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-11 w-11 rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center shrink-0">
                {isVideo ? <VideoIcon size={16} className="text-[#87102C] dark:text-[#e8768a]" /> : <Play size={16} className="text-[#87102C] dark:text-[#e8768a]" />}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {sermon?.title ?? 'Loading…'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {isVideo ? 'Video · tap to watch' : sermon ? `${sermon.speaker} · ${fmtTime(current)} / ${fmtTime(duration)}` : ''}
              </p>
            </div>
            <ChevronUp size={16} className={`shrink-0 text-gray-300 dark:text-gray-600 transition-transform hidden sm:block ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {!isVideo && sermon && (
            <div className="hidden sm:flex items-center gap-1 shrink-0">
              <button type="button" onClick={() => skip(-15)} title="Back 15s" className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-[#87102C] text-white flex items-center justify-center hover:bg-[#6E0C24] transition-all"
              >
                {playing ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" />}
              </button>
              <button type="button" onClick={() => skip(15)} title="Forward 15s" className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <RotateCw size={16} />
              </button>
            </div>
          )}

          {!isVideo && sermon && (
            <button
              type="button"
              onClick={togglePlay}
              className="sm:hidden w-9 h-9 rounded-full bg-[#87102C] text-white flex items-center justify-center hover:bg-[#6E0C24] transition-all shrink-0"
            >
              {playing ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" />}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close player"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {!isVideo && sermon && (
          <div className="px-3 sm:px-5 pb-2 hidden sm:block">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={1}
              value={current}
              onChange={seek}
              className="w-full h-1 rounded-full appearance-none bg-gray-200 dark:bg-white/10 accent-[#87102C] cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
