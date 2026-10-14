"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  chapterAudioUrl,
  loadChapterManifest,
  verseChapter,
  type ChapterManifest,
} from "@/lib/bible-audio";
import {
  PlayerContext,
  RATE_KEY,
  RATES,
  ReadAloudProvider,
  RegisterContext,
  readSetting,
  saveSetting,
  type ReadAloudPassage,
  type ReadAloudState,
  type ReadAloudStatus,
} from "./read-aloud";

/**
 * Listening to the day's reading from a recording of each chapter.
 *
 * The device voice stops as soon as a phone leaves the page, because the
 * browser only keeps a page's sound going while it plays real audio. A
 * recorded chapter is real audio, so with the Media Session details below it
 * carries on with the screen locked or the app minimised, and the lock screen
 * and headphones can pause it or move to the next chapter.
 *
 * It offers the same controls as the device voice, so the Listen card and the
 * floating bar work unchanged. A recording cannot follow the text verse by
 * verse, so the chapter being read is shown instead of a highlighted verse.
 * If the chapter list cannot load, the device voice takes over.
 */

export interface Track {
  sequence: number;
  label: string | null;
  bookId: number;
  chapter: number;
  /** "Genesis 1", "Psalm 23". */
  title: string;
  url: string;
}

/** One track per chapter the day's passages touch, in reading order. */
export function buildTracks(passages: ReadAloudPassage[], manifest: ChapterManifest): Track[] {
  const tracks: Track[] = [];
  for (const passage of [...passages].sort((a, b) => a.sequence - b.sequence)) {
    for (const verse of passage.verses) {
      const { bookId, chapter } = verseChapter(verse.verseId);
      const last = tracks[tracks.length - 1];
      if (last && last.bookId === bookId && last.chapter === chapter) continue;
      const url = chapterAudioUrl(manifest, bookId, chapter);
      if (!url) continue;
      const book = verse.book.trim();
      tracks.push({
        sequence: passage.sequence,
        label: passage.label,
        bookId,
        chapter,
        title: `${/^psalms$/i.test(book) ? "Psalm" : book} ${chapter}`,
        url,
      });
    }
  }
  return tracks;
}

function mediaSession(): MediaSession | null {
  return typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession : null;
}

export function RecordedAudioProvider({
  expected,
  planTitle,
  children,
}: {
  expected: number;
  planTitle?: string;
  children: ReactNode;
}) {
  const [manifest, setManifest] = useState<ChapterManifest | null>(null);
  const [manifestFailed, setManifestFailed] = useState(false);
  const [passages, setPassages] = useState<ReadonlyMap<number, ReadAloudPassage>>(() => new Map());
  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [rate, setRateState] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);
  const statusRef = useRef(status);
  const rateRef = useRef(1);

  const tracks = useMemo(
    () => (manifest ? buildTracks(Array.from(passages.values()), manifest) : []),
    [manifest, passages],
  );
  const tracksRef = useRef(tracks);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    loadChapterManifest()
      .then((loaded) => {
        if (!cancelled) setManifest(loaded);
      })
      .catch(() => {
        if (!cancelled) setManifestFailed(true);
      });
    const savedRate = Number(readSetting(RATE_KEY));
    if ((RATES as readonly number[]).includes(savedRate)) {
      rateRef.current = savedRate;
      setRateState(savedRate);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Leaving the day stops its reading and clears the lock screen.
  useEffect(() => () => {
    audioRef.current?.pause();
    const session = mediaSession();
    if (session) {
      session.metadata = null;
      session.playbackState = "none";
    }
  }, []);

  /** Starts a chapter. Called straight from a tap, so phones allow the sound. */
  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    const track = tracksRef.current[index];
    if (!audio || !track) return;
    indexRef.current = index;
    setActiveIndex(index);
    setError(null);
    setStatus("playing");
    if (audio.src !== track.url) {
      audio.src = track.url;
    }
    audio.playbackRate = rateRef.current;
    audio.play().catch((reason: unknown) => {
      // A newer play() or pause() interrupting this one is not a failure.
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setStatus("paused");
      setError(
        reason instanceof DOMException && reason.name === "NotAllowedError"
          ? "Press Listen to start the recording."
          : "The recording could not be played. Check your connection and press Listen to try again.",
      );
    });
  }, []);

  const play = useCallback(() => {
    if (tracksRef.current.length === 0) return;
    const audio = audioRef.current;
    const track = tracksRef.current[indexRef.current];
    // Resuming carries on from where it stopped rather than restarting the chapter.
    if (audio && track && audio.src === track.url && statusRef.current === "paused") {
      setError(null);
      setStatus("playing");
      audio.playbackRate = rateRef.current;
      audio.play().catch(() => {
        setStatus("paused");
        setError("The recording could not be played. Check your connection and press Listen to try again.");
      });
      return;
    }
    playTrack(statusRef.current === "finished" ? 0 : indexRef.current);
  }, [playTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    indexRef.current = 0;
    setActiveIndex(null);
    setStatus("idle");
  }, []);

  const skip = useCallback((direction: 1 | -1) => {
    const list = tracksRef.current;
    if (list.length === 0) return;
    const audio = audioRef.current;
    let target = indexRef.current + direction;
    // Back restarts the chapter under way if it is a few seconds in.
    if (direction === -1 && audio && audio.currentTime > 5) target = indexRef.current;
    if (target < 0) target = 0;
    if (target >= list.length) return;
    if (statusRef.current === "playing") {
      if (target === indexRef.current && audio) audio.currentTime = 0;
      else playTrack(target);
    } else {
      indexRef.current = target;
      setActiveIndex(target);
      if (audio && statusRef.current === "paused") {
        audio.src = list[target].url;
      }
    }
  }, [playTrack]);

  const setRate = useCallback((next: number) => {
    rateRef.current = next;
    setRateState(next);
    saveSetting(RATE_KEY, String(next));
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, []);

  const register = useCallback((passage: ReadAloudPassage) => {
    setPassages((previous) => {
      const existing = previous.get(passage.sequence);
      if (
        existing &&
        existing.verses === passage.verses &&
        existing.reference === passage.reference &&
        existing.label === passage.label
      ) {
        return previous;
      }
      const next = new Map(previous);
      next.set(passage.sequence, passage);
      return next;
    });
  }, []);

  const onEnded = useCallback(() => {
    const next = indexRef.current + 1;
    if (next < tracksRef.current.length) {
      // Moving straight on from the finished chapter keeps the phone's audio
      // session alive, so the next chapter plays with the screen off too.
      playTrack(next);
      return;
    }
    indexRef.current = 0;
    setActiveIndex(null);
    setStatus("finished");
    const session = mediaSession();
    if (session) session.playbackState = "none";
  }, [playTrack]);

  const onError = useCallback(() => {
    if (statusRef.current !== "playing") return;
    setStatus("paused");
    setError("The recording could not be loaded. Check your connection and press Listen to try again.");
  }, []);

  // A headset or the lock screen can pause and resume the audio directly.
  const onPause = useCallback(() => {
    const audio = audioRef.current;
    if (statusRef.current === "playing" && audio && !audio.ended) setStatus("paused");
  }, []);
  const onPlay = useCallback(() => {
    if (statusRef.current === "paused") setStatus("playing");
  }, []);

  const activeTrack = activeIndex == null ? null : tracks[activeIndex] ?? null;

  // Lock screen, notification shade and headphone controls.
  useEffect(() => {
    const session = mediaSession();
    if (!session || !activeTrack) return;
    try {
      session.metadata = new MediaMetadata({
        title: activeTrack.title,
        artist: "World English Bible · read by Winfred W. Henson",
        album: planTitle ?? "Everlasting Hills Church",
        artwork: [{ src: new URL("/icons/icon-512.png", window.location.href).toString(), sizes: "512x512", type: "image/png" }],
      });
    } catch {
      // Older browsers without MediaMetadata still play; they just show no details.
    }
    const audio = () => audioRef.current;
    const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ["play", () => play()],
      ["pause", () => pause()],
      ["stop", () => stop()],
      ["previoustrack", () => skip(-1)],
      ["nexttrack", () => skip(1)],
      ["seekbackward", (details) => { const a = audio(); if (a) a.currentTime = Math.max(0, a.currentTime - (details.seekOffset ?? 15)); }],
      ["seekforward", (details) => { const a = audio(); if (a) a.currentTime = Math.min(a.duration || 0, a.currentTime + (details.seekOffset ?? 15)); }],
      ["seekto", (details) => { const a = audio(); if (a && details.seekTime != null) a.currentTime = details.seekTime; }],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // An action this browser does not support.
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // Unsupported action, nothing to clear.
        }
      }
    };
  }, [activeTrack, planTitle, play, pause, stop, skip]);

  useEffect(() => {
    const session = mediaSession();
    if (!session || !activeTrack) return;
    session.playbackState = status === "playing" ? "playing" : status === "paused" ? "paused" : "none";
  }, [status, activeTrack]);

  const onLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    const session = mediaSession();
    if (!audio || !session || !isFinite(audio.duration) || typeof session.setPositionState !== "function") return;
    try {
      session.setPositionState({ duration: audio.duration, position: Math.min(audio.currentTime, audio.duration), playbackRate: audio.playbackRate });
    } catch {
      // Not supported here.
    }
  }, []);

  const value = useMemo<ReadAloudState>(
    () => ({
      kind: "recording",
      supported: true,
      ready: !!manifest && passages.size >= expected && tracks.length > 0,
      status,
      error,
      activeVerseId: null,
      current: activeTrack ? { reference: activeTrack.title, label: activeTrack.label } : null,
      passageCount: tracks.length,
      rate,
      voices: [],
      voiceURI: null,
      play,
      pause,
      stop,
      skip,
      setRate,
      setVoice: () => {},
    }),
    [manifest, passages, expected, tracks, status, error, activeTrack, rate, play, pause, stop, skip, setRate],
  );

  if (manifestFailed) {
    return <ReadAloudProvider expected={expected}>{children}</ReadAloudProvider>;
  }

  return (
    <RegisterContext.Provider value={register}>
      <PlayerContext.Provider value={value}>
        {children}
        <audio
          ref={audioRef}
          preload="none"
          className="hidden"
          onEnded={onEnded}
          onError={onError}
          onPause={onPause}
          onPlay={onPlay}
          onLoadedMetadata={onLoadedMetadata}
          onRateChange={onLoadedMetadata}
        />
      </PlayerContext.Provider>
    </RegisterContext.Provider>
  );
}
