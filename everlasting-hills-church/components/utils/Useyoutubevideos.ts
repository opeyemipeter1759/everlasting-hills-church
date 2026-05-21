import { useState, useEffect } from "react";
import type {
  VideoCategory,
  YouTubeAPIVideo,
  YouTubeChannelResponse,
  YouTubePlaylistResponse,
  YouTubeVideo,
  YouTubeVideosResponse,
} from "@/types";

const BASE_URL = "https://www.googleapis.com/youtube/v3";

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

/**
 * Detect category label from video title/description.
 * Adjust keywords to match your church's naming conventions.
 */
function detectCategory(video: YouTubeAPIVideo): VideoCategory {
  const text = `${video.snippet.title} ${video.snippet.description}`.toLowerCase();
  if (text.includes("short")) return "Shorts";
  if (text.includes("tuesday") || text.includes("bible study") || text.includes("word feast"))
    return "Tuesday";
  if (text.includes("sunday") || text.includes("service")) return "Sunday";
  return "Other";
}

/** Returns a formatted date string: "3 May 2026" */
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Converts ISO 8601 duration (PT1H2M3S) → "1h 2m" or "52 min" */
function formatDuration(iso: string): string {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const hours = parseInt(match[1] ?? "0", 10);
  const mins = parseInt(match[2] ?? "0", 10);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins} min`;
}

interface UseYouTubeVideosReturn {
  videos: YouTubeVideo[];
  loading: boolean;
  error: string | null;
}

export function useYouTubeVideos(maxResults = 12): UseYouTubeVideosReturn {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_KEY || !CHANNEL_ID) {
      setError(
        "YouTube API key or Channel ID is missing. Set NEXT_PUBLIC_YOUTUBE_API_KEY and NEXT_PUBLIC_YOUTUBE_CHANNEL_ID in .env.local"
      );
      setLoading(false);
      return;
    }

    async function fetchVideos(): Promise<void> {
      try {
        setLoading(true);

        // Step 1: Get uploads playlist ID for the channel
        const channelRes = await fetch(
          `${BASE_URL}/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`
        );
        const channelData: YouTubeChannelResponse = await channelRes.json();

        if (!channelData.items?.length) {
          throw new Error("Channel not found. Check your CHANNEL_ID.");
        }

        const uploadsPlaylistId =
          channelData.items[0].contentDetails.relatedPlaylists.uploads;

        // Step 2: Get video IDs from uploads playlist
        const playlistRes = await fetch(
          `${BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${API_KEY}`
        );
        const playlistData: YouTubePlaylistResponse = await playlistRes.json();

        const videoIds = playlistData.items
          .map((item) => item.snippet.resourceId?.videoId)
          .filter((id): id is string => Boolean(id))
          .join(",");

        // Step 3: Get full video details (duration, stats, etc.)
        const videosRes = await fetch(
          `${BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${API_KEY}`
        );
        const videosData: YouTubeVideosResponse = await videosRes.json();

        const enriched: YouTubeVideo[] = videosData.items.map((video) => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail:
            video.snippet.thumbnails?.maxres?.url ??
            video.snippet.thumbnails?.high?.url ??
            video.snippet.thumbnails?.medium?.url,
          publishedAt: video.snippet.publishedAt,
          formattedDate: formatDate(video.snippet.publishedAt),
          duration: formatDuration(video.contentDetails.duration),
          category: detectCategory(video),
          watchUrl: `https://www.youtube.com/watch?v=${video.id}`,
          channelTitle: video.snippet.channelTitle,
        }));

        setVideos(enriched);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load videos.");
      } finally {
        setLoading(false);
      }
    }

    void fetchVideos();
  }, [maxResults]);

  return { videos, loading, error };
}