import type { ArticleCard } from "@/lib/api/articles";
import { authorName } from "@/lib/api/articles";
import type { BlogArticleSummary } from "@/lib/api/blog";

/**
 * One shape for an article in a list, whether it came from the app's feed or
 * the public blog, so both render through the same Medium-style row.
 */
export interface Story {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  scriptureLabel: string | null;
  readingMinutes: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  featured: boolean;
  author: { name: string; photoUrl: string | null; memberId: string | null };
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
}

export function fromCard(a: ArticleCard): Story {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle?.trim() || a.excerpt,
    coverImageUrl: a.coverImageUrl,
    scriptureLabel: a.scriptureLabel,
    readingMinutes: a.readingMinutes,
    likeCount: a.likeCount,
    commentCount: a.commentCount ?? 0,
    publishedAt: a.publishedAt,
    featured: !!a.featuredAt,
    author: { name: authorName(a.Author), photoUrl: a.Author?.Member?.photoUrl ?? null, memberId: a.Author?.Member?.id ?? null },
    likedByMe: a.likedByMe,
    bookmarkedByMe: a.bookmarkedByMe,
  };
}

export function fromBlog(a: BlogArticleSummary & { subtitle?: string | null }): Story {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle?.trim() || a.excerpt,
    coverImageUrl: a.coverImageUrl,
    scriptureLabel: a.scriptureLabel,
    readingMinutes: a.readingMinutes,
    likeCount: a.likeCount,
    commentCount: a.commentCount,
    publishedAt: a.publishedAt,
    featured: !!a.featuredAt,
    author: { name: a.author.name, photoUrl: a.author.photoUrl, memberId: a.author.memberId },
  };
}

/** "Aug 31", or "Aug 31, 2025" when it is not this year: Medium's dates. */
export function storyDate(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "Africa/Lagos",
  });
}

/** 8400 → "8.4K". */
export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${Math.round(n / 1000)}K`;
}

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
