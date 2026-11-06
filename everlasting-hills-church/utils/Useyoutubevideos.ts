import { useState, useEffect } from "react";
import type { YouTubeVideo } from "@/types";

interface UseYouTubeVideosReturn {
  videos: YouTubeVideo[];
  loading: boolean;
  error: string | null;
}

/**
 * The church channel's uploads (newest `maxResults`, or all of them), via the
 * server route at /api/youtube-videos, which holds the API key and caches.
 */
export function useYouTubeVideos(maxResults = Infinity): UseYouTubeVideosReturn {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchVideos(): Promise<void> {
      try {
        setLoading(true);
        const res = await fetch("/api/youtube-videos", { signal: controller.signal });
        const body: { videos?: YouTubeVideo[]; error?: string } = await res.json();
        if (!res.ok || !body.videos) throw new Error(body.error ?? "Failed to load videos.");
        setVideos(Number.isFinite(maxResults) ? body.videos.slice(0, maxResults) : body.videos);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load videos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void fetchVideos();
    return () => controller.abort();
  }, [maxResults]);

  return { videos, loading, error };
}
