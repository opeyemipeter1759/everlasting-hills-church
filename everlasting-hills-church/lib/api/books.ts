"use client";

import { useQuery } from "@tanstack/react-query";
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

/** Shelves that currently have at least one published book, in order. */
export function useBookCollectionsFeed() {
  return useQuery({
    queryKey: ["book-collections", "feed"],
    queryFn: () => api.get<BookCollection[]>("/book-collections/feed"),
    staleTime: 60 * 1000,
  });
}

/** The church library: every published book, newest first. */
export function useBooksFeed() {
  return useQuery({
    queryKey: ["books", "feed"],
    queryFn: () => api.get<Book[]>("/books/feed"),
    staleTime: 60 * 1000,
  });
}

/** One book to read. */
export function useBook(id?: string) {
  return useQuery({
    queryKey: ["books", "one", id],
    queryFn: () => api.get<Book>(`/books/${id}`),
    enabled: Boolean(id),
  });
}
