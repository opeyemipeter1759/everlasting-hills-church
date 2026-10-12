"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface BlogAuthor {
  memberId: string | null;
  name: string;
  photoUrl: string | null;
}

export interface BlogArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  subtitle?: string | null;
  coverImageUrl: string | null;
  scriptureLabel: string | null;
  readingMinutes: number;
  likeCount: number;
  featuredAt: string | null;
  publishedAt: string | null;
  author: BlogAuthor;
  commentCount: number;
}

export interface BlogArticle extends Omit<BlogArticleSummary, "featuredAt"> {
  body: string;
  viewCount: number;
}

export interface BlogPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BlogComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  isMember: boolean;
  memberId: string | null;
  photoUrl: string | null;
  canDelete?: boolean;
}

export interface ManagedArticle {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  viewCount: number;
  likeCount: number;
  featuredAt: string | null;
  publishedAt: string | null;
  submittedAt: string | null;
  updatedAt: string;
  author: BlogAuthor;
  commentCount: number;
}

export interface RecentComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  isMember: boolean;
  article: { title: string; slug: string };
}

/**
 * Comments, read and written either as a visitor on the public blog or as a
 * signed-in member inside the app (who can also remove what they may).
 */
export function useArticleComments(slug: string, page: number, asMember: boolean) {
  return useQuery({
    queryKey: ["articles", "comments", slug, page, asMember],
    queryFn: () =>
      api.get<BlogPage<BlogComment>>(asMember ? `/articles/${slug}/comments` : `/public/articles/${slug}/comments`, { page }),
    placeholderData: keepPreviousData,
  });
}

export function usePostArticleComment(slug: string, asMember: boolean) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; body: string; website?: string }) =>
      api.post<{ id: string }>(asMember ? `/articles/${slug}/comments` : `/public/articles/${slug}/comments`, asMember ? { body: input.body } : input),
    onSuccess: () => client.invalidateQueries({ queryKey: ["articles", "comments", slug] }),
  });
}

export function useDeleteArticleComment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => api.delete(`/articles/comments/${commentId}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function useManagedArticles(filters: { status: string; q: string; page: number }) {
  return useQuery({
    queryKey: ["articles", "manage", filters],
    queryFn: () =>
      api.get<BlogPage<ManagedArticle>>("/articles/manage/list", {
        status: filters.status || undefined,
        q: filters.q.trim() || undefined,
        page: filters.page,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useRecentArticleComments() {
  return useQuery({
    queryKey: ["articles", "manage", "comments"],
    queryFn: () => api.get<RecentComment[]>("/articles/manage/comments"),
  });
}

export function useDeleteArticle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/articles/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function useArchiveArticle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/articles/${id}`, { status: "ARCHIVED" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["articles"] }),
  });
}

/** The article's address on the public blog, for sharing anywhere. */
export function publicArticleUrl(slug: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.everlastinghills.church";
  return `${origin}/articles/${slug}`;
}
