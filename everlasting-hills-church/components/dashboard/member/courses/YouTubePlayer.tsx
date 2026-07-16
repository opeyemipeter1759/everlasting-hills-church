"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getYouTubeId } from "@/lib/youtube";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
        },
      ) => { destroy: () => void };
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReady: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (!apiReady) {
    apiReady = new Promise((resolve) => {
      const existing = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        existing?.();
        resolve();
      };
      if (!document.getElementById("youtube-iframe-api")) {
        const script = document.createElement("script");
        script.id = "youtube-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    });
  }
  return apiReady;
}

/**
 * Wraps the YouTube IFrame Player API so we can detect real completion (the "ended"
 * event) rather than just "the page was opened". Mount with a `key` per lesson so a
 * lesson switch is a clean remount instead of trying to reuse the player instance.
 */
export default function YouTubePlayer({ url, onEnded }: { url: string; onEnded: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const [ready, setReady] = useState(false);

  const videoId = getYouTubeId(url);

  useEffect(() => {
    setReady(false);
    if (!videoId || !containerRef.current) return;

    let player: { destroy: () => void } | null = null;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT || !containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { autoplay: 1, rel: 0 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => {
            if (e.data === window.YT?.PlayerState.ENDED) onEndedRef.current();
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [url, videoId]);

  if (!videoId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black px-6 text-center text-sm text-white/50">
        This video link couldn't be read.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 size={28} className="animate-spin text-white/40" />
        </div>
      )}
      <div className="h-full w-full" ref={containerRef} />
    </div>
  );
}
