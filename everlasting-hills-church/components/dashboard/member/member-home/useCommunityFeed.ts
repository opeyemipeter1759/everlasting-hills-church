"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/axios";
import type { FeedPost } from "./types";

export function useCommunityFeed(initialFeed: FeedPost[]) {
  const [posts, setPosts] = useState<FeedPost[]>(initialFeed);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reactingIds, setReactingIds] = useState<Set<string>>(new Set());

  async function handleSubmit() {
    const text = draft.trim();
    if (!text || submitting) return;

    const tempId = `temp-${Date.now()}`;
    const tempPost: FeedPost = {
      id: tempId,
      text,
      reactions: 0,
      createdAt: new Date().toISOString(),
      authorName: "You",
      authorPhotoUrl: null,
    };

    // Optimistic: show immediately, clear draft
    setPosts((prev) => [tempPost, ...prev]);
    setDraft("");
    setSubmitting(true);

    try {
      const res = await apiClient.post<{ id: string; createdAt: string }>("/community/posts", { text });
      // Replace temp entry with server-assigned id
      setPosts((prev) =>
        prev.map((p) => p.id === tempId ? { ...p, id: res.data.id, createdAt: res.data.createdAt } : p)
      );
    } catch {
      // Roll back and restore draft
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      setDraft(text);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReact(id: string) {
    if (reactingIds.has(id)) return;
    setReactingIds((prev) => new Set(prev).add(id));
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, reactions: p.reactions + 1 } : p));
    try {
      await apiClient.post(`/community/posts/${id}/react`);
    } catch {
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, reactions: Math.max(0, p.reactions - 1) } : p));
    } finally {
      setReactingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  return { posts, draft, setDraft, submitting, reactingIds, handleSubmit, handleReact };
}
