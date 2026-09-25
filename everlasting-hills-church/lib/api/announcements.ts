"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface AnnouncementFeedItem {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  eventTime: string | null;
  venue: string | null;
  /** Set when this announcement was raised from a published event. */
  eventId?: string | null;
  Event?: { slug: string; customPath: string | null } | null;
}

/** Where an announcement leads, when it leads anywhere. */
export function announcementHref(a: AnnouncementFeedItem): string | null {
  if (!a.Event) return null;
  return a.Event.customPath ?? `/events/${a.Event.slug}`;
}

/** Published announcements, newest first. Shared by the dashboard popover and
 * the member home panel, so both read the same list. */
export function useAnnouncementsFeed() {
  return useQuery({
    queryKey: ["announcements", "feed"],
    queryFn: () => api.get<AnnouncementFeedItem[]>("/announcements/feed"),
    staleTime: 60 * 1000,
  });
}
