"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/**
 * Member written articles.
 *
 * The feed is shared and cheap to refetch; a member's own shelf includes drafts
 * and is never cached across people. Likes are optimistic, because a tap that
 * waits for a round trip on a Nigerian mobile connection feels broken, and the
 * server is idempotent in both directions so a failed one can simply roll back.
 */

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface ArticleAuthor {
  id: string;
  Member: { firstName: string | null; lastName: string | null; photoUrl: string | null } | null;
}

export interface ArticleCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  scriptureLabel: string | null;
  readingMinutes: number;
  likeCount: number;
  featuredAt: string | null;
  publishedAt: string | null;
  Author: ArticleAuthor | null;
  likedByMe: boolean;
}

export interface Article extends ArticleCard {
  body: string;
  status: ArticleStatus;
  startVerseId: number | null;
  endVerseId: number | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  isAuthor: boolean;
}

export interface MyArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: ArticleStatus;
  scriptureLabel: string | null;
  readingMinutes: number;
  likeCount: number;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ArticleFeed {
  articles: ArticleCard[];
  meta: { page: number; limit: number; total: number };
}

const FEED_KEY = ["articles", "feed"] as const;
const MINE_KEY = ["articles", "mine"] as const;

export function useArticleFeed(page = 1, authorId?: string) {
  return useQuery({
    queryKey: [...FEED_KEY, page, authorId ?? "all"],
    queryFn: () =>
      api.get<ArticleFeed>(
        `/articles?page=${page}&limit=20${authorId ? `&authorId=${authorId}` : ""}`,
      ),
    staleTime: 60 * 1000,
  });
}

/** One article. A draft comes back only for its author. */
export function useArticle(slug?: string) {
  return useQuery({
    queryKey: ["articles", "one", slug],
    queryFn: () => api.get<Article>(`/articles/${slug}`),
    enabled: Boolean(slug),
  });
}

/** Everything the member has written, drafts first. */
export function useMyArticles() {
  return useQuery({
    queryKey: MINE_KEY,
    queryFn: () => api.get<MyArticle[]>("/articles/mine"),
  });
}

export interface ArticleDraft {
  title: string;
  body: string;
  startVerseId?: number;
  endVerseId?: number;
  scriptureLabel?: string;
  publish?: boolean;
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ArticleDraft) =>
      api.post<{ id: string; slug: string; status: ArticleStatus }>("/articles", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEED_KEY });
      qc.invalidateQueries({ queryKey: MINE_KEY });
    },
  });
}

/**
 * Edit, publish, unpublish or archive.
 *
 * Null clears a field and undefined leaves it alone, which is the difference
 * between removing a scripture citation and simply not touching it. Axios drops
 * undefined keys from the body, so the two really do reach the server apart.
 */
export interface ArticleEdit {
  id: string;
  title?: string;
  body?: string;
  startVerseId?: number | null;
  endVerseId?: number | null;
  scriptureLabel?: string | null;
  status?: ArticleStatus;
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ArticleEdit) =>
      api.patch<{ id: string; slug: string; status: ArticleStatus }>(`/articles/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEED_KEY });
      qc.invalidateQueries({ queryKey: MINE_KEY });
      qc.invalidateQueries({ queryKey: ["articles", "one"] });
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/articles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEED_KEY });
      qc.invalidateQueries({ queryKey: MINE_KEY });
    },
  });
}

/**
 * Like or un-like, applied to the cache first.
 *
 * The server decides the real count, so the optimistic step only has to be
 * close enough to feel instant. On failure the previous cache is restored,
 * which is safe precisely because the endpoint is idempotent.
 */
export function useSetArticleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean; slug?: string }) =>
      liked
        ? api.post<{ likeCount: number; likedByMe: boolean }>(`/articles/${id}/like`)
        : api.delete<{ likeCount: number; likedByMe: boolean }>(`/articles/${id}/like`),

    onMutate: async ({ id, liked, slug }) => {
      await qc.cancelQueries({ queryKey: FEED_KEY });
      const previous = qc.getQueriesData({ queryKey: FEED_KEY });

      qc.setQueriesData<ArticleFeed>({ queryKey: FEED_KEY }, (old) =>
        old
          ? {
              ...old,
              articles: old.articles.map((a) =>
                a.id === id
                  ? { ...a, likedByMe: liked, likeCount: Math.max(0, a.likeCount + (liked ? 1 : -1)) }
                  : a,
              ),
            }
          : old,
      );

      const oneKey = ["articles", "one", slug] as const;
      const previousOne = slug ? qc.getQueryData<Article>(oneKey) : undefined;
      if (slug && previousOne) {
        qc.setQueryData<Article>(oneKey, {
          ...previousOne,
          likedByMe: liked,
          likeCount: Math.max(0, previousOne.likeCount + (liked ? 1 : -1)),
        });
      }

      return { previous, previousOne, slug };
    },

    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
      if (context?.slug && context.previousOne) {
        qc.setQueryData(["articles", "one", context.slug], context.previousOne);
      }
    },

    onSettled: (_data, _err, variables) => {
      qc.invalidateQueries({ queryKey: FEED_KEY });
      if (variables?.slug) {
        qc.invalidateQueries({ queryKey: ["articles", "one", variables.slug] });
      }
    },
  });
}

/** Pastors and admins only; the button is hidden for everybody else. */
export function useSetArticleFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      featured
        ? api.post<{ id: string; featuredAt: string | null }>(`/articles/${id}/feature`)
        : api.delete<{ id: string; featuredAt: string | null }>(`/articles/${id}/feature`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FEED_KEY });
      qc.invalidateQueries({ queryKey: ["articles", "one"] });
    },
  });
}

/** "Grace Adeyemi", or "A member" when a profile has no member record. */
export function authorName(author: ArticleAuthor | null | undefined): string {
  const first = author?.Member?.firstName?.trim();
  const last = author?.Member?.lastName?.trim();
  const name = [first, last].filter(Boolean).join(" ");
  return name || "A member";
}

export function authorInitials(author: ArticleAuthor | null | undefined): string {
  const name = authorName(author);
  if (name === "A member") return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
