"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { CreatePlayer, PlayerHandle, PlayerState } from "./video/player-adapter";
import { createYouTubePlayer } from "./video/youtube-adapter";
import Arches from "./Arches";

/** The house ease. */
const EASE = [0.22, 1, 0.36, 1] as const;
/** How often the player reports to the server while playing. */
const HEARTBEAT_MS = 15_000;
/** How often the playhead is checked against the furthest point watched. */
const POLL_MS = 500;
/** The playhead may run this far past the furthest point before it is pulled back. */
const SLACK_SECONDS = 2;
/** The video is stopped this close to its end, before the host can draw its end screen. */
const STOP_BEFORE_END_SECONDS = 0.5;
/** If the end is reached but the server has not confirmed the watching by now, say so. */
const CONFIRM_WAIT_MS = 8_000;
/** Keys the host's player answers to. None of them do anything here. */
const BLOCKED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "j", "J", "l", "L", "k", "K", ".", ",", "<", ">", "f", "F", "m", "M", "c", "C", "i", "I"]);

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type Phase = "poster" | "loading" | "ready";

/**
 * A lesson video that has to be watched, not skipped, and that never leaves the
 * page. Nothing is downloaded until the learner presses play on our own poster.
 * After that the host's player sits under a shield that takes every click, so its
 * logo, title, share button, "more videos" panel and end screen can never be
 * reached or shown: paused and ended are our own screens. There is no way to move
 * ahead of the furthest point watched (the playhead is pulled back, speed is held
 * at 1, the host's keyboard is off) and a hidden tab pauses the video.
 *
 * The player only reports. The server credits the watching and is the only thing
 * that marks a video watched; `watched` is its answer. This guard is for honest
 * learners: the learner's browser is their own, and the server is the real gate.
 */
export default function LessonVideo({
  videoId,
  title,
  durationHint,
  watched,
  resumeAt,
  onStart,
  onBeat,
  onUnavailable,
  createPlayer = createYouTubePlayer,
}: {
  videoId: string;
  title: string;
  /** The video's length as the server knows it, for the poster, before the player has loaded. */
  durationHint: number | null;
  watched: boolean;
  /** Where the server has seen this learner reach; playing resumes there. */
  resumeAt: number;
  /** Called once, when playing first begins. */
  onStart: (position: number) => void;
  /** Called every 15 seconds while playing, and on pause, end and a hidden tab. */
  onBeat: (position: number, maxWatched: number) => void;
  onUnavailable: () => void;
  createPlayer?: CreatePlayer;
}) {
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerHandle | null>(null);
  const furthest = useRef(resumeAt);
  const watchedRef = useRef(watched);
  const started = useRef(false);
  const playingRef = useRef(false);
  const lastBeatAt = useRef(0);
  const onStartRef = useRef(onStart);
  const onBeatRef = useRef(onBeat);
  watchedRef.current = watched;
  onStartRef.current = onStart;
  onBeatRef.current = onBeat;

  const [phase, setPhase] = useState<Phase>("poster");
  const [state, setState] = useState<PlayerState>("unstarted");
  const [awaitingPlay, setAwaitingPlay] = useState(false);
  const [ended, setEnded] = useState(false);
  const [confirmLate, setConfirmLate] = useState(false);
  const [time, setTime] = useState(resumeAt);
  const [duration, setDuration] = useState(durationHint ?? 0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    setCanFullscreen(typeof document !== "undefined" && !!document.fullscreenEnabled && !!wrapRef.current?.requestFullscreen);
  }, []);

  const beat = useCallback(() => {
    const p = playerRef.current;
    if (!p || watchedRef.current || !started.current) return;
    lastBeatAt.current = Date.now();
    onBeatRef.current(p.currentTime(), furthest.current);
  }, []);

  /** Stops the video just before its end and shows our own end screen. */
  const finish = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.pause();
    furthest.current = Math.max(furthest.current, p.duration());
    setEnded(true);
    beat();
  }, [beat]);

  const handleState = useCallback(
    (s: PlayerState) => {
      const p = playerRef.current;
      const isPlaying = s === "playing";
      playingRef.current = isPlaying;
      setState(s);
      if (isPlaying) {
        setAwaitingPlay(false);
        setEnded(false);
        if (!started.current && !watchedRef.current && p) {
          started.current = true;
          lastBeatAt.current = Date.now();
          onStartRef.current(p.currentTime());
        }
      }
      if (s === "ended") finish();
      else if ((s === "paused" || s === "cued") && started.current) beat();
    },
    [beat, finish],
  );

  const begin = useCallback(async () => {
    const host = hostRef.current;
    if (!host || playerRef.current) return;
    setPhase("loading");
    // The host replaces this element with its own frame, so it is made here and kept out of React's tree.
    const mount = document.createElement("div");
    mount.id = `lesson-player-${videoId}`;
    host.appendChild(mount);
    try {
      const player = await createPlayer(mount, videoId, {
        onReady: () => undefined,
        onState: handleState,
        onRateChange: (rate) => {
          if (rate !== 1 && !watchedRef.current) playerRef.current?.setRate(1);
        },
        onError: onUnavailable,
      });
      playerRef.current = player;
      setPhase("ready");
      setDuration((d) => d || player.duration());
      setVolume(player.volume());
      setMuted(player.isMuted());
      if (resumeAt > 0 && !watchedRef.current) {
        furthest.current = resumeAt;
        player.seekTo(resumeAt);
      }
      setAwaitingPlay(true);
      player.play();
      // If the browser refused to start playing without a fresh tap, our paused screen takes over.
      window.setTimeout(() => setAwaitingPlay(false), 2000);
    } catch {
      mount.remove();
      setPhase("poster");
      onUnavailable();
    }
  }, [createPlayer, handleState, onUnavailable, resumeAt, videoId]);

  // The playhead check: no forward movement, ever.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const t = p.currentTime();
      if (!watchedRef.current) {
        if (t > furthest.current + SLACK_SECONDS) {
          p.seekTo(furthest.current);
        } else if (playingRef.current) {
          furthest.current = Math.max(furthest.current, t);
        }
        if (p.rate() !== 1) p.setRate(1);
      }
      const d = p.duration();
      if (playingRef.current && d > 0 && t >= d - STOP_BEFORE_END_SECONDS) finish();
      setTime(t);
      setDuration((d) => d || p.duration());
      if (playingRef.current && Date.now() - lastBeatAt.current >= HEARTBEAT_MS) beat();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [beat, finish]);

  // Watching in a background tab does not count: the video pauses.
  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && playingRef.current) playerRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(
    () => () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    },
    [],
  );

  // After the end: wait for the server's word, and say so if it does not come.
  useEffect(() => {
    if (!ended || watched) {
      setConfirmLate(false);
      return;
    }
    const t = window.setTimeout(() => setConfirmLate(true), CONFIRM_WAIT_MS);
    return () => window.clearTimeout(t);
  }, [ended, watched]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (phase === "poster") {
      void begin();
      return;
    }
    if (!p || phase !== "ready") return;
    if (p.state() === "playing") p.pause();
    else p.play();
  };

  const seek = (to: number) => {
    const p = playerRef.current;
    if (!p) return;
    const limit = watchedRef.current ? duration : furthest.current;
    const target = Math.max(0, Math.min(to, limit));
    p.seekTo(target);
    setTime(target);
    setEnded(false);
  };

  const replay = () => {
    seek(0);
    playerRef.current?.play();
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    const next = !p.isMuted();
    p.setMuted(next);
    setMuted(next);
  };

  const changeVolume = (v: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.setVolume(v);
    setVolume(v);
    if (v > 0 && p.isMuted()) {
      p.setMuted(false);
      setMuted(false);
    }
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  /** Keys the host's player would answer to do nothing here. Our own sliders keep their arrow keys. */
  const onKeyDownCapture = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (BLOCKED_KEYS.has(e.key) || /^[0-9]$/.test(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const watchedTo = watched ? duration : Math.max(furthest.current, time);
  const pct = (s: number) => (duration > 0 ? `${Math.min(100, Math.max(0, (s / duration) * 100))}%` : "0%");
  const isPlaying = state === "playing";
  const showSkeleton = phase === "loading" || (phase === "ready" && (state === "buffering" || awaitingPlay) && !ended);
  const showPaused = phase === "ready" && !ended && !isPlaying && !showSkeleton;

  const onBarPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "ready" || duration <= 0) return;
    if (e.type === "pointermove" && e.buttons === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    // Back is always allowed. Forward is allowed only once the video has been watched.
    seek(fraction * duration);
  };

  const iconButton =
    "inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] disabled:opacity-40";
  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: reduceMotion ? 0 : 0.35, ease: EASE } };

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-label={title}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDownCapture={onKeyDownCapture}
      className="select-none overflow-hidden rounded-[20px] bg-[var(--color-ink)] [&:fullscreen]:flex [&:fullscreen]:flex-col [&:fullscreen]:justify-center [&:fullscreen]:rounded-none"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-ink)]">
        {/* The host's frame goes in here once play is pressed. Until then, nothing is loaded. */}
        <div ref={hostRef} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" aria-hidden="true" />

        {/* The shield: takes every click and tap, so nothing inside the host's frame can be reached. */}
        <div aria-hidden="true" onClick={togglePlay} className="absolute inset-0 z-10 cursor-pointer" data-testid="video-shield" />

        <AnimatePresence>
          {phase === "poster" && (
            <motion.div key="poster" {...fade} onClick={togglePlay} className="absolute inset-0 z-20 cursor-pointer">
              <Screen title={title}>
                <PlayButton label={watched ? "Watch again" : "Watch the lesson"} />
                <p className="mt-4 text-sm text-white/55">
                  {durationHint ? `${clock(durationHint)}. ` : ""}The video loads when you press play.
                </p>
              </Screen>
            </motion.div>
          )}
          {showSkeleton && (
            <motion.div key="loading" {...fade} className="absolute inset-0 z-20">
              <Screen title={title} quiet>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/15" role="status" aria-label="Getting your video ready">
                  <div className="h-full w-1/3 rounded-full bg-white/60 motion-safe:animate-pulse" />
                </div>
                <p className="mt-4 text-sm text-white/55">Getting your video ready</p>
              </Screen>
            </motion.div>
          )}
          {showPaused && (
            <motion.div key="paused" {...fade} onClick={togglePlay} className="absolute inset-0 z-20 cursor-pointer">
              <Screen title={title}>
                <PlayButton label={furthest.current > 5 ? "Resume" : "Play"} />
                <p className="mt-4 text-sm tabular-nums text-white/55">
                  {watched ? "Watched" : `You have watched ${clock(furthest.current)} of ${clock(duration)}`}
                </p>
              </Screen>
            </motion.div>
          )}
          {ended && (
            <motion.div key="ended" {...fade} className="absolute inset-0 z-20">
              <Screen title={title}>
                {watched ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-[var(--color-gold)]" aria-hidden />
                    <p className="cls-display mt-4 text-3xl text-white sm:text-4xl">Lesson watched</p>
                    <p className="mt-2 text-white/65">Write your summary below.</p>
                    <button type="button" onClick={replay} className="cls-btn cls-btn-glass mt-5 !px-5 !py-2.5 !text-sm">
                      <RotateCcw className="h-4 w-4" aria-hidden /> Watch again
                    </button>
                  </>
                ) : confirmLate ? (
                  <>
                    <p className="cls-display text-2xl text-white sm:text-3xl">Some of this lesson was not counted</p>
                    <p className="mt-2 max-w-sm text-white/65">Watch it through again, without skipping, and your summary will open.</p>
                    <button type="button" onClick={replay} className="cls-btn cls-btn-primary mt-5 !px-5 !py-2.5 !text-sm">
                      <RotateCcw className="h-4 w-4" aria-hidden /> Watch again
                    </button>
                  </>
                ) : (
                  <>
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/15" role="status" aria-label="Checking your watching">
                      <div className="h-full w-1/3 rounded-full bg-white/60 motion-safe:animate-pulse" />
                    </div>
                    <p className="mt-4 text-white/65">Checking your watching</p>
                  </>
                )}
              </Screen>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The only controls. The progress bar shows where you have been and never lets you move ahead. */}
      <div className="flex items-center gap-1.5 px-2 py-2 sm:gap-2 sm:px-3">
        <button type="button" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"} className={iconButton}>
          {isPlaying ? <Pause className="h-4 w-4 fill-current" aria-hidden /> : <Play className="h-4 w-4 fill-current" aria-hidden />}
        </button>
        <button type="button" onClick={() => seek(time - 10)} disabled={phase !== "ready"} aria-label="Back 10 seconds" className={iconButton}>
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
        <div
          role="progressbar"
          aria-label={watched ? "Watched" : "Watched so far. You can go back, but not ahead."}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(watchedTo)}
          onPointerDown={onBarPointer}
          onPointerMove={onBarPointer}
          className="relative mx-1 h-8 min-w-0 flex-1 cursor-pointer touch-none"
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/15" />
          <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--color-gold)]" style={{ width: pct(watchedTo) }} />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
            style={{ left: pct(time) }}
            aria-hidden="true"
          />
        </div>
        <span className="hidden w-[5.5rem] flex-none text-right text-xs tabular-nums text-white/65 xs:inline">
          {clock(time)} / {clock(duration)}
        </span>
        <button type="button" onClick={toggleMute} disabled={phase !== "ready"} aria-label={muted ? "Unmute" : "Mute"} className={iconButton}>
          {muted || volume === 0 ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={muted ? 0 : volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          disabled={phase !== "ready"}
          aria-label="Volume"
          className="hidden h-1 w-16 flex-none cursor-pointer accent-[var(--color-burgundy)] sm:block"
        />
        {canFullscreen && (
          <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Leave full screen" : "Full screen"} className={iconButton}>
            {fullscreen ? <Minimize className="h-4 w-4" aria-hidden /> : <Maximize className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}

/** One of our own screens over the video: poster, loading, paused and ended all use it, so the host's never shows. */
function Screen({ title, quiet = false, children }: { title: string; quiet?: boolean; children: React.ReactNode }) {
  return (
    <div className="cls-glow cls-on-ink relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6 text-center">
      <Arches className="absolute bottom-0 left-1/2 h-[55%] w-auto -translate-x-1/2 text-white" />
      <div className="relative flex flex-col items-center">
        {!quiet && <p className="cls-display mb-5 max-w-xl text-2xl text-white sm:text-3xl">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/** The screen around it handles the press, so a tap anywhere on the poster or the paused screen plays. */
function PlayButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative z-30 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-burgundy)] text-white shadow-lg transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ink)] sm:h-20 sm:w-20"
    >
      <Play className="ml-1 h-7 w-7 fill-white sm:h-8 sm:w-8" aria-hidden />
    </button>
  );
}
