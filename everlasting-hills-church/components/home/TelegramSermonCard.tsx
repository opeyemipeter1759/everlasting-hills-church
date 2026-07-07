"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Play, Pause, Loader2 } from "lucide-react";
import type { TelegramSermonItem } from "@/lib/telegram-sermons";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Strips the trailing file extension for a cleaner display title. */
function displayTitle(title: string): string {
  return title.replace(/\.(aac|mp3|m4a|wav|ogg|opus)$/i, "").trim() || title;
}

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface TelegramSermonCardProps {
  item: TelegramSermonItem;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export default function TelegramSermonCard({ item, isPlaying, onTogglePlay }: TelegramSermonCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  // The proxy route buffers the whole file server-side before responding, so a large
  // sermon can take a while to start — `loading` covers that gap so Play doesn't look broken.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      setErrored(false);
      setLoading(true);
      audio.play().catch(() => setErrored(true));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  }

  return (
    <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_100%)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-white/18 sm:p-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#FFB3C1] transition-all hover:border-white/20 hover:bg-white/10"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" fill="currentColor" />
          ) : (
            <Play className="h-6 w-6" fill="currentColor" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">
            {displayTitle(item.title)}
          </h3>
          <p className="mt-1.5 text-xs text-white/55">
            {errored
              ? "Couldn't load audio — try opening in Telegram"
              : isPlaying || current > 0
                ? `${formatDate(item.publishedAt)} · ${formatTime(current)} / ${formatTime(duration)}`
                : `${formatDate(item.publishedAt)}${item.sizeLabel ? ` · ${item.sizeLabel}` : ""}`}
          </p>
        </div>

        <a
          href={item.postUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#FFB3C1] transition-all hover:border-white/20 hover:bg-white/10"
          title="Open in Telegram"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {isPlaying && !loading && !errored && (
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={1}
          value={current}
          onChange={seek}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#87102C]"
        />
      )}

      <audio
        ref={audioRef}
        src={item.audioUrl}
        preload="none"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onCanPlay={() => setLoading(false)}
        onEnded={onTogglePlay}
        onError={() => {
          setLoading(false);
          setErrored(true);
        }}
        className="hidden"
      />
    </div>
  );
}
