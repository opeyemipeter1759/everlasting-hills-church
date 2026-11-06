// Server only: imported by app/api/youtube-videos, never by client components.
import type {
  VideoCategory,
  YouTubeAPIVideo,
  YouTubeChannelResponse,
  YouTubePlaylistResponse,
  YouTubeVideo,
  YouTubeVideosResponse,
} from "@/types";

const BASE_URL = "https://www.googleapis.com/youtube/v3";

// YouTube API hard caps: 50 items per playlistItems page, 50 ids per videos.list call.
const API_PAGE_SIZE = 50;

// Every visitor shares one cached copy instead of spending quota per page view.
const REVALIDATE_SECONDS = 1800;

/**
 * Reads an env var at request time. A literal `process.env.NEXT_PUBLIC_X` is
 * replaced at build time, and the Docker build has no YouTube key, so the
 * lookup goes through a variable name to read the Cloud Run value instead.
 */
function runtimeEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export class YouTubeConfigError extends Error {}

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
    timeZone: "Africa/Lagos",
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

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`YouTube API responded ${res.status}`);
  return (await res.json()) as T;
}

/** Every upload on the church channel (or the newest `maxResults`), newest first. */
export async function fetchChannelVideos(maxResults = Infinity): Promise<YouTubeVideo[]> {
  const apiKey = runtimeEnv("YOUTUBE_API_KEY", "NEXT_PUBLIC_YOUTUBE_API_KEY");
  const channelId = runtimeEnv("YOUTUBE_CHANNEL_ID", "NEXT_PUBLIC_YOUTUBE_CHANNEL_ID");
  if (!apiKey || !channelId) {
    throw new YouTubeConfigError("YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID must be set on the server");
  }

  // Step 1: Get uploads playlist ID for the channel
  const channelData = await getJson<YouTubeChannelResponse>(
    `${BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
  );
  if (!channelData.items?.length) {
    throw new YouTubeConfigError("Channel not found. Check YOUTUBE_CHANNEL_ID.");
  }
  const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  // Step 2: Page through the entire uploads playlist (YouTube caps each
  // page at 50 items, so we follow nextPageToken until it runs out).
  const videoIds: string[] = [];
  let pageToken: string | undefined;
  do {
    const pageSize = Math.min(API_PAGE_SIZE, maxResults - videoIds.length);
    const playlistData = await getJson<YouTubePlaylistResponse>(
      `${BASE_URL}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${pageSize}&key=${apiKey}` +
        (pageToken ? `&pageToken=${pageToken}` : "")
    );
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
    const videosData = await getJson<YouTubeVideosResponse>(
      `${BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${batch}&key=${apiKey}`
    );
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
        channelUrl: `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`,
        channelTitle: video.snippet.channelTitle,
        viewCount: formatCompactNumber(video.statistics.viewCount),
        likeCount: formatCompactNumber(video.statistics.likeCount),
        commentCount: formatCompactNumber(video.statistics.commentCount),
      }))
    );
  }
  return enriched;
}
