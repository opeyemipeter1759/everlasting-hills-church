import { UserRole } from "@/config/config";

export type VideoCategory = "Sunday" | "Saturday" | "Shorts" | "Other";

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
  embedUrl: string;
  shareUrl: string;
  channelUrl: string;
  channelTitle: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
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

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: UserRole | string | null;
    fullName?: string | null;
    picture?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LatestSermon {
  id: string;
  tenantId: string;
  title: string;
  speaker: string;
  date: string;
  type?: SermonType;
  audioUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  description: string | null;
  publishedAt: string;
  createdAt: string;
  audioDuration: number | null;
  audioKey: string | null;
  isFeatured: boolean;
  playCount: number;
  scheduledFor: string | null;
  scriptureRef: string | null;
  series: string | null;
  seriesSlug: string | null;
  slug: string;
  status: string;
  tags: string[];
  transcript: string | null;
  updatedAt: string;
  episodes?: SermonEpisodeInput[];
}

export interface LatestSermonsResponse {
  data: LatestSermon[];
  meta: {
    timestamp: string;
  };
}

export interface SermonAdminOverviewData {
  totalSermons: number;
  totalSeries: number;
  totalSingle: number;
  totalDrafted: number;
  totalPublished: number;
}

export interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  glowFrom: string;
  glowTo: string;
  accentBar: string;
  description: string;
  loading: boolean;
}

export interface SermonEpisodeInput {
  id?: string;
  title: string;
  url: string;
  videoUrl?: string;
  duration?: number;
  order: number;
}

export type SermonType = 'SINGLE' | 'SERIES';
export type SermonStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

export type UpdateSermonPayload = Partial<CreateSermonPayload>;

export interface CreateSermonPayload {
  title: string;
  speaker: string;
  date: string;
  type: SermonType;
  url?: string;
  duration?: number;
  episodes?: SermonEpisodeInput[];
  description?: string;
  transcript?: string;
  scriptureRef?: string;
  series?: string;
  tags?: string[];
  audioUrl?: string;
  audioKey?: string;
  audioDuration?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: SermonStatus;
  scheduledFor?: string;
}