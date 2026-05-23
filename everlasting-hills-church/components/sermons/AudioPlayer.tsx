"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from "lucide-react";

function fmtTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function AudioPlayer({
  src,
  sermonSlug,
  initialPosition = 0,
  onProgress,
}: {
  src: string;
  sermonSlug: string;
  initialPosition?: number;
  onProgress?: (pos: number, completed: boolean) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const progressSavedAt = useRef(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setDuration(audio.duration);
      setLoaded(true);
      if (initialPosition > 0 && initialPosition < audio.duration - 5) {
        audio.currentTime = initialPosition;
        setCurrent(initialPosition);
      }
    };
    const onTime = () => {
      setCurrent(audio.currentTime);
      // Save progress every 10 seconds
      if (audio.currentTime - progressSavedAt.current > 10) {
        progressSavedAt.current = audio.currentTime;
        const completed = audio.duration > 0 && audio.currentTime / audio.duration > 0.9;
        onProgress?.(Math.floor(audio.currentTime), completed);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      onProgress?.(Math.floor(audio.duration), true);
    };
    const onPlay = () => { setPlaying(true); countPlay(); };
    const onPause = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [initialPosition, onProgress]);

  const counted = useRef(false);
  function countPlay() {
    if (counted.current) return;
    counted.current = true;
    fetch(`/api/sermons/${sermonSlug}/play`, { method: "POST" }).catch(() => {});
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause(); else audio.play();
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  }

  function skip(delta: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
      <audio ref={audioRef} src={src} preload="metadata" muted={muted} />

      {/* Progress bar */}
      <div className="space-y-1.5">
        <input
          type="range" min={0} max={duration || 1} step={1} value={current}
          onChange={seek}
          className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/10 accent-[#87102C] cursor-pointer"
          style={{ background: `linear-gradient(to right, #87102C ${pct}%, transparent ${pct}%)` }}
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 font-mono">
          <span>{fmtTime(current)}</span>
          <span>{fmtTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={() => skip(-15)} title="Back 15s"
          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <RotateCcw size={18} />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!loaded}
          className="w-12 h-12 rounded-full bg-[#87102C] text-white flex items-center justify-center hover:bg-[#6E0C24] disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
        >
          {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
        </button>
        <button type="button" onClick={() => skip(15)} title="Forward 15s"
          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <RotateCw size={18} />
        </button>
        <button type="button" onClick={() => setMuted((m) => !m)} title="Toggle mute"
          className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
    </div>
  );
}
