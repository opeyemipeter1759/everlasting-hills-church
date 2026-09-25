import { UserRole } from "@/config/config";

export type VideoCategory =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Shorts"
  | "Other";

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
  nextPageToken?: string;
}

export interface YouTubeVideosResponse {
  items: YouTubeAPIVideo[];
}

export interface LoginResponse {
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: UserRole | string | null;
    fullName: string | null;
    picture: string | null;
    firstName?: string | null;
    lastName?: string | null;
    /** True until a provisioned account completes the signed password-setup flow. */
    needsPasswordChange: boolean;
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
  _count?: {
    SermonReaction: number;
    SermonBookmark: number;
    SermonComment: number;
  };
}

export interface LatestSermonsResponse {
  data: LatestSermon[];
  meta: {
    timestamp: string;
  };
}

/* ── Events ──────────────────────────────────────────────────────────────── */

export type EventStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EventLocationType = "PHYSICAL" | "ONLINE" | "HYBRID";
export type EventSectionType =
  | "RICH_TEXT"
  | "SCHEDULE"
  | "EXPECTATIONS"
  | "PRAYER_FOCUS"
  | "FAQ"
  | "TESTIMONY"
  | "CTA";

export interface EventSchedule {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  recurrenceRule: string | null;
  meetingUrl: string | null;
  sortOrder: number;
}

interface EventSectionBase<T extends EventSectionType, C> {
  id: string;
  eventId: string;
  type: T;
  title: string | null;
  subtitle: string | null;
  content: C;
  sortOrder: number;
  isVisible: boolean;
  version: number;
}

export type EventSection =
  | EventSectionBase<"RICH_TEXT", { body: string }>
  | EventSectionBase<"SCHEDULE", { introduction?: string; tags: string[] }>
  | EventSectionBase<"EXPECTATIONS", {
      introduction?: string;
      items: { title: string; description: string; scripture?: string; icon?: string }[];
    }>
  | EventSectionBase<"PRAYER_FOCUS", {
      focuses: {
        title: string;
        introduction?: string;
        dayDate?: string;
        declaration?: string;
        scriptures: string[];
        prayerPoints: string[];
      }[];
    }>
  | EventSectionBase<"FAQ", { items: { question: string; answer: string }[] }>
  | EventSectionBase<"TESTIMONY", { body: string; buttonLabel: string; url?: string }>
  | EventSectionBase<"CTA", { body?: string; buttonLabel: string; url?: string }>;

/** Slim shape returned by GET /events (public index). */
export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  theme: string | null;
  shortDescription: string | null;
  startAt: string;
  endAt: string | null;
  timezone: string;
  locationType: EventLocationType;
  venueName: string | null;
  flyerImageUrl: string | null;
  coverImageUrl: string | null;
  heroImageUrl: string | null;
  socialImageUrl: string | null;
  liveUrl: string | null;
  registrationUrl: string | null;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  featured: boolean;
  customPath: string | null;
  /** Whether this event is taking RSVPs at all. Cards must not offer to
   * register somebody for an event that was never accepting them. */
  rsvpEnabled: boolean;
  registrationRequired: boolean;
  Schedules: EventSchedule[];
}

/** Full event returned by GET /events/:slug and the admin endpoints. */
export interface EventDetail extends EventSummary {
  tenantId: string;
  description: string | null;
  venueAddress: string | null;
  mapsLink: string | null;
  hostName: string | null;
  guestMinister: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  testimonyUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: EventStatus;
  rsvpEnabled: boolean;
  capacity: number | null;
  order: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  Sections: EventSection[];
  _count?: { Rsvps: number };
}

export interface EventRsvp {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string | null;
  attendees: number;
  message: string | null;
  createdAt: string;
  /** Whether this email already belongs to an existing member account. */
  isMember: boolean;
  /** Marked at the door once this person actually shows up. */
  checkedIn: boolean;
  checkedInAt: string | null;
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
  duration: number;
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

// ── Member Dashboard ──────────────────────────────────────────────────────────

export interface MemberHomeProps {
  member: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: string | null;
    bio: string | null;
    photoUrl: string | null;
  } | null;
  userEmail: string;
  memberDisplayId: string;
  attendanceRate: number;
  attendanceCount: number;
  streakWeeks: number;
  lastServiceDate: string | null;
  nextService: { name: string; scheduledAt: string } | null;
  hasCheckedInToday: boolean;
  todayService: { id: string; name: string; sermonTitle?: string | null } | null;
  prayerCount: number;
  recentServices: Array<{ name: string; scheduledAt: string; totalAttended: number }>;
  monthlyAttendance: Array<{ label: string; attended: number; total: number }>;
  birthdayDaysUntil: number | null;
  sermonStreak: number;
  bookmarks: Array<{ slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; audioUrl: string | null }>;
  listenHistory: Array<{ slug: string; title: string; speaker: string; date: string; thumbnailUrl: string | null; positionSec: number; completed: boolean; audioDuration: number | null }>;
  announcements: Array<{ id: string; title: string; body: string; createdAt: string }>;
  communityBirthdays: Array<{ firstName: string; lastName: string; photoUrl: string | null }>;
  ministryUnit: { name: string; nextServingDate: string } | null;
  featuredSermon: {
    slug: string; title: string; speaker: string; date: string;
    thumbnailUrl: string | null; audioUrl: string | null; description?: string | null;
  } | null;
  pastorWord: { text: string; audioUrl?: string | null } | null;
  dailyPrayer: string | null;
  communityFeed: Array<{ id: string; authorName: string; authorPhotoUrl: string | null; text: string; createdAt: string; reactions: number }>;
  onlineCount: number | null;
  discipleshipMilestones: Array<{ label: string; completedAt: string | null }>;
  memberSince: string | null;
  anniversaryDaysUntil: number | null;
}

export type MemberHomePropsOptional = Partial<MemberHomeProps>;

export interface Unit {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { UnitMember: number };
}

export interface UnitMemberEntry {
  id: string;
  memberId: string;
  isLead: boolean;
  isAssistant?: boolean;
  position?: { id: string; name: string } | null;
  Member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    photoUrl: string | null;
    status: string;
  };
}

export interface UnitDetail extends Unit {
  UnitMember: UnitMemberEntry[];
}

export interface UnitMessage {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  readAt: string | null;
  isRead: boolean;
  replyToId: string | null;
  ReplyTo: { id: string; content: string; senderId: string; deletedAt: string | null } | null;
  isMine: boolean;
}

export interface UnitPosition {
  id: string;
  unitId: string;
  name: string;
  createdAt: string;
}

export type UnitTaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type UnitTaskReportOutcome = "COMPLETED" | "IN_PROGRESS" | "BLOCKED";
export type UnitTaskReportStatus = "SUBMITTED" | "ACKNOWLEDGED" | "NEEDS_REVISION";

export interface UnitTask {
  id: string;
  unitId: string;
  title: string;
  description: string | null;
  assignedToId: string | null;
  status: UnitTaskStatus;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  AssignedTo: { id: string; firstName: string; lastName: string; photoUrl: string | null } | null;
  _count: { Comments: number; Reports: number };
  /** Most recent report on the task, if any — enough to show where it stands. */
  latestReport: {
    id: string;
    outcome: UnitTaskReportOutcome;
    status: UnitTaskReportStatus;
    createdAt: string;
    authorId: string;
  } | null;
}

export interface UnitTaskReport {
  id: string;
  taskId: string;
  outcome: UnitTaskReportOutcome;
  summary: string;
  challenges: string | null;
  nextSteps: string | null;
  status: UnitTaskReportStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: { profileId: string; name: string; photoUrl: string | null } | null;
  author: { profileId: string; name: string; photoUrl: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnitExpense {
  id: string;
  unitId: string;
  title: string;
  amount: number;
  category: string | null;
  date: string;
  description: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

export interface UnitTaskComment {
  id: string;
  content: string;
  author: { profileId: string; name: string; photoUrl: string | null } | null;
  createdAt: string;
}

export interface MemberRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export type Role =
  | "MEMBER"
  | "UNIT_LEAD"
  | "ADMIN"
  | "PASTOR"
  | "SUPER_ADMIN"
  | null;

export function isAdminPlus(role: Role): boolean {
  return role === "ADMIN" || role === "PASTOR" || role === "SUPER_ADMIN";
}
