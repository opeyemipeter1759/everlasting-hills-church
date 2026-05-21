// Shared TypeScript types used across the app.
// Keep Prisma-generated types in lib/db.ts; put hand-crafted DTOs and
// API response shapes here.
export {};

export type VideoCategory = "Sunday" | "Tuesday" | "Shorts" | "Other";

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string | undefined;
  publishedAt: string;
  formattedDate: string;
  duration: string;
  category: VideoCategory;
  watchUrl: string;
  channelTitle: string;
}

export interface CategoryCounts {
  total: number;
  [key: string]: number;
}

// ── Raw YouTube API response shapes ──

interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

interface YouTubeSnippet {
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  thumbnails: {
    default?: YouTubeThumbnail;
    medium?: YouTubeThumbnail;
    high?: YouTubeThumbnail;
    standard?: YouTubeThumbnail;
    maxres?: YouTubeThumbnail;
  };
  resourceId?: {
    videoId: string;
  };
}

export interface YouTubeAPIVideo {
  id: string;
  snippet: YouTubeSnippet;
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface YouTubePlaylistItem {
  snippet: YouTubeSnippet;
}

export interface YouTubeChannelResponse {
  items: Array<{
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }>;
}

export interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
}

export interface YouTubeVideosResponse {
  items: YouTubeAPIVideo[];
}