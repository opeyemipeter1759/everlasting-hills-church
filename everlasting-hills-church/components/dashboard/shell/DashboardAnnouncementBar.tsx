"use client";

import { AnnouncementTicker } from "@/components/announcements/AnnouncementTicker";
import { useAnnouncementsFeed } from "@/lib/api/announcements";

/**
 * The announcements strip on every dashboard page. DashboardLayouts places it in
 * the pinned header right under the top bar, so it stays fixed with it, full width
 * against the sidebar. Same list as the announcements bell; nothing shows when empty.
 */
export default function DashboardAnnouncementBar() {
  const { data: announcements = [] } = useAnnouncementsFeed();
  if (announcements.length === 0) return null;
  return <AnnouncementTicker announcements={announcements} variant="bar" />;
}
