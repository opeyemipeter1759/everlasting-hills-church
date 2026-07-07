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

const WEEKDAYS: VideoCategory[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Weekday (in the church's local timezone) the video was actually published on. */
function weekdayFromPublishedAt(iso: string): VideoCategory {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Other";
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "long",
  }).format(date);
  return (WEEKDAYS as string[]).includes(weekday) ? (weekday as VideoCategory) : "Other";
}

/**
 * Detect category label for a video. "Shorts" is a format, so it's still
 * detected from the title; Sunday/Saturday are derived from the actual
 * publish date instead of guessed from keywords.
 */
function detectCategory(video: YouTubeAPIVideo): VideoCategory {
  const text = `${video.snippet.title} ${video.snippet.description}`.toLowerCase();
  if (text.includes("short")) return "Shorts";
  return weekdayFromPublishedAt(video.snippet.publishedAt);
}

function formatCompactNumber(value: string): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
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

// YouTube API hard caps: 50 items per playlistItems page, 50 ids per videos.list call.
const API_PAGE_SIZE = 50;

export function useYouTubeVideos(maxResults = Infinity): UseYouTubeVideosReturn {
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

        // Step 2: Page through the entire uploads playlist (YouTube caps each
        // page at 50 items, so we follow nextPageToken until it runs out).
        const videoIds: string[] = [];
        let pageToken: string | undefined;
        do {
          const pageSize = Math.min(API_PAGE_SIZE, maxResults - videoIds.length);
          const playlistRes = await fetch(
            `${BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${pageSize}&key=${API_KEY}` +
              (pageToken ? `&pageToken=${pageToken}` : "")
          );
          const playlistData: YouTubePlaylistResponse = await playlistRes.json();

          for (const item of playlistData.items) {
            const id = item.snippet.resourceId?.videoId;
            if (id) videoIds.push(id);
          }
          pageToken = playlistData.nextPageToken;
        } while (pageToken && videoIds.length < maxResults);

        // Step 3: Get full video details (duration, stats, etc.) in batches
        // of 50 ids per request (the videos.list per-call limit).
        const enriched: YouTubeVideo[] = [];
        for (let i = 0; i < videoIds.length; i += API_PAGE_SIZE) {
          const batch = videoIds.slice(i, i + API_PAGE_SIZE).join(",");
          const videosRes = await fetch(
            `${BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${batch}&key=${API_KEY}`
          );
          const videosData: YouTubeVideosResponse = await videosRes.json();

          enriched.push(
            ...videosData.items.map((video) => ({
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
              embedUrl: `https://www.youtube.com/embed/${video.id}`,
              shareUrl: `https://www.youtube.com/watch?v=${video.id}`,
              channelUrl: `https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`,
              channelTitle: video.snippet.channelTitle,
              viewCount: formatCompactNumber(video.statistics.viewCount),
              likeCount: formatCompactNumber(video.statistics.likeCount),
              commentCount: formatCompactNumber(video.statistics.commentCount),
            }))
          );
        }

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