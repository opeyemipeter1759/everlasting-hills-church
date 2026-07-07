"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ehc:last-seen-announcement-at";

/**
 * Tracks which announcements are new since the visitor's last visit, using
 * a locally persisted "last seen" timestamp — no backend read-state needed.
 */
export function useUnseenAnnouncements(createdAtIsoDates: string[]) {
  const [lastSeenAt, setLastSeenAt] = useState<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setLastSeenAt(stored ? Number(stored) : 0);
  }, []);

  const isUnseen = useCallback(
    (iso: string) => lastSeenAt !== null && new Date(iso).getTime() > lastSeenAt,
    [lastSeenAt]
  );

  const unseenCount =
    lastSeenAt === null ? 0 : createdAtIsoDates.filter(isUnseen).length;

  const markSeen = useCallback(() => {
    const now = Date.now();
    window.localStorage.setItem(STORAGE_KEY, String(now));
    setLastSeenAt(now);
  }, []);

  return { unseenCount, isUnseen, markSeen };
}
