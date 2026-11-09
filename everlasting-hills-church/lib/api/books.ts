"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface BookCollection {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  coverUrl: string | null;
  fileUrl: string;
  status: "DRAFT" | "PUBLISHED";
  collectionId: string | null;
  Collection: BookCollection | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /books/feed: the member Books page in one request, books and their shelves together. */
const BOOKS_FEED = {
  queryKey: ["books", "feed"],
  queryFn: () => api.get<{ books: Book[]; collections: BookCollection[] }>("/books/feed"),
  staleTime: 60 * 1000,
};

/** Shelves that currently have at least one published book, in order. Shares one request with useBooksFeed. */
export function useBookCollectionsFeed() {
  return useQuery({ ...BOOKS_FEED, select: (d: { collections: BookCollection[] }) => d.collections });
}

/** The church library: every published book, newest first. Shares one request with useBookCollectionsFeed. */
export function useBooksFeed() {
  return useQuery({ ...BOOKS_FEED, select: (d: { books: Book[] }) => d.books });
}

/** One book to read. */
export function useBook(id?: string) {
  return useQuery({
    queryKey: ["books", "one", id],
    queryFn: () => api.get<Book>(`/books/${id}`),
    enabled: Boolean(id),
  });
}

export interface BookComment {
  id: string;
  content: string;
  createdAt: string;
  memberId: string;
  Member: { firstName: string; lastName: string; photoUrl: string | null };
}

export function useBookComments(bookId?: string) {
  return useQuery({
    queryKey: ["books", "comments", bookId],
    queryFn: () => api.get<BookComment[]>(`/books/${bookId}/comments`),
    enabled: !!bookId,
  });
}

export function useAddBookComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, content }: { bookId: string; content: string }) =>
      api.post<BookComment>(`/books/me/${bookId}/comments`, { content }),
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ["books", "comments", bookId] });
    },
  });
}

export function useDeleteBookComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; bookId: string }) =>
      api.delete<{ id: string; deleted: boolean }>(`/books/me/comments/${commentId}`),
    onSuccess: (_data, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ["books", "comments", bookId] });
    },
  });
}

/** Books I have marked as finished: they count towards my reading badges. */
export function useMyReadBooks() {
  return useQuery({
    queryKey: ["books", "me", "read"],
    queryFn: () => api.get<string[]>("/books/me/read"),
  });
}

export function useToggleBookRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, read }: { bookId: string; read: boolean }) =>
      read ? api.post(`/books/me/${bookId}/read`, {}) : api.delete(`/books/me/${bookId}/read`),
    onSuccess: () => client.invalidateQueries({ queryKey: ["books", "me", "read"] }),
  });
}
