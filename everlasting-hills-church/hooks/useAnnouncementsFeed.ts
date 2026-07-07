"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/axios";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export function useAnnouncementsFeed(enabled: boolean) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<Announcement[]>("/announcements/feed")
      .then((res) => {
        if (!cancelled) setAnnouncements(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { announcements, loading };
}
