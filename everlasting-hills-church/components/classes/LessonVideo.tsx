"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Pause, Play, RotateCcw } from "lucide-react";

/* A minimal slice of the YouTube IFrame Player API: only what is used here. */
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
}
interface YTApi {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
}
/** The player API puts itself on `window`; another player in the app types the same globals differently, so this file reads them through its own view of the window. */
interface YTWindow {
  YT?: YTApi;
  onYouTubeIframeAPIReady?: () => void;
}
const ytWindow = () => window as unknown as YTWindow;

const ENDED = 0;
const PLAYING = 1;
/** How far past the furthest point watched the playhead may drift before it is pulled back. */
const SLACK_SECONDS = 1.5;
/** The video counts as finished when the watcher has reached this close to the end. */
const END_SECONDS = 3;

let apiLoading: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (ytWindow().YT?.Player) return Promise.resolve();
  if (!apiLoading) {
    apiLoading = new Promise<void>((resolve, reject) => {
      const previous = ytWindow().onYouTubeIframeAPIReady;
      ytWindow().onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => {
        apiLoading = null;
        reject(new Error("The video player could not load."));
      };
      document.head.appendChild(script);
    });
  }
  return apiLoading;
}

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * A lesson video that has to be watched, not skipped. The YouTube controls are
 * off and replaced with a bar that can rewind but not move ahead of the
 * furthest point watched; the keyboard and playback speed are locked; and the
 * lesson is only marked watched when the video reaches its end. Once it has
 * been watched, the bar moves freely so it can be revisited.
 *
 * This is a guard for honest learners, not a lock: the browser is the
 * learner's own. If the player cannot load, `onUnavailable` lets the lesson
 * fall back to a plain link.
 */
export default function LessonVideo({
  videoId,
  title,
  watched,
  onFinished,
  onUnavailable,
}: {
  videoId: string;
  title: string;
  watched: boolean;
  onFinished: () => void;
  onUnavailable: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const furthest = useRef(0);
  const watchedRef = useRef(watched);
  const finishedOnce = useRef(false);
  const onFinishedRef = useRef(onFinished);
  watchedRef.current = watched;
  onFinishedRef.current = onFinished;

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const maybeFinish = useCallback(() => {
    const p = playerRef.current;
    if (!p || watchedRef.current || finishedOnce.current) return;
    const d = p.getDuration();
    if (d > 0 && furthest.current >= d - END_SECONDS) {
      finishedOnce.current = true;
      onFinishedRef.current();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    loadYouTubeApi()
      .then(() => {
        const YT = ytWindow().YT;
        if (cancelled || !mountRef.current || !YT) return;
        playerRef.current = new YT.Player(mountRef.current, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, playsinline: 1 },
          events: {
            onReady: () => {
              setReady(true);
              setDuration(playerRef.current?.getDuration() ?? 0);
            },
            onStateChange: (e) => {
              setPlaying(e.data === PLAYING);
              if (e.data === ENDED) {
                const p = playerRef.current;
                if (p && !watchedRef.current) furthest.current = Math.max(furthest.current, p.getDuration());
                maybeFinish();
              }
            },
          },
        });
        timer = setInterval(() => {
          const p = playerRef.current;
          if (!p || typeof p.getCurrentTime !== "function") return;
          const t = p.getCurrentTime();
          if (!watchedRef.current) {
            if (t > furthest.current + SLACK_SECONDS) p.seekTo(furthest.current, true);
            else furthest.current = Math.max(furthest.current, t);
            if (p.getPlaybackRate() !== 1) p.setPlaybackRate(1);
          }
          setTime(t);
          setDuration((d) => d || p.getDuration());
          maybeFinish();
        }, 400);
      })
      .catch(() => {
        if (!cancelled) onUnavailable();
      });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // The video is fixed for the life of this component; callbacks go through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const toggle = () => {
    const p = playerRef.current;
    if (!p || !ready) return;
    if (p.getPlayerState() === PLAYING) p.pauseVideo();
    else p.playVideo();
  };

  const seek = (to: number) => {
    const p = playerRef.current;
    if (!p) return;
    const limit = watchedRef.current ? duration : furthest.current;
    const target = Math.max(0, Math.min(to, limit));
    p.seekTo(target, true);
    setTime(target);
  };

  const fullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  const buttonClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]";

  return (
    <div ref={wrapRef} role="group" aria-label={title} className="overflow-hidden rounded-[18px] bg-black [&:fullscreen]:flex [&:fullscreen]:flex-col [&:fullscreen]:justify-center">
      <div className="relative aspect-video w-full">
        <div ref={mountRef} className="absolute inset-0 h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
        {/* Sits over the player so its own controls, links and context menu cannot be reached. */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause the video" : "Play the video"}
          className="absolute inset-0 z-10 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-gold)]"
        >
          {!playing && ready && (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-burgundy)] text-white shadow-lg sm:h-20 sm:w-20">
              <Play className="ml-1 h-7 w-7 fill-white sm:h-8 sm:w-8" aria-hidden />
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
        <button type="button" onClick={toggle} disabled={!ready} aria-label={playing ? "Pause" : "Play"} className={buttonClass}>
          {playing ? <Pause className="h-4 w-4 fill-current" aria-hidden /> : <Play className="h-4 w-4 fill-current" aria-hidden />}
        </button>
        <button type="button" onClick={() => seek(time - 10)} disabled={!ready} aria-label="Back 10 seconds" className={buttonClass}>
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          step={1}
          value={Math.min(Math.floor(time), Math.max(1, Math.floor(duration)))}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!ready}
          aria-label={watched ? "Video position" : "Video position. You can go back, but not ahead of what you have watched."}
          className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--color-burgundy)]"
        />
        <span className="w-[5.5rem] flex-none text-right text-xs tabular-nums text-white/65">
          {clock(time)} / {clock(duration)}
        </span>
        <button type="button" onClick={fullscreen} aria-label="Full screen" className={buttonClass}>
          <Maximize className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
