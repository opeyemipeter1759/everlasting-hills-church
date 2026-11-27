"use client";

import { AnnouncementTicker } from "@/components/announcements/AnnouncementTicker";
import { useAnnouncementsFeed } from "@/lib/api/announcements";

/**
 * The announcements strip on every dashboard page: full width under the top bar,
 * edge to edge against the sidebar, and fixed under the top bar (h-16) while the
 * page scrolls, as the top bar is. Below the top bar's z-30 so its menus open over
 * it. Same list as the top bar's announcements bell; nothing shows when it's empty.
 */
export default function DashboardAnnouncementBar() {
  const { data: announcements = [] } = useAnnouncementsFeed();
  if (announcements.length === 0) return null;
  return (
    <div className="sticky top-16 z-20">
      <AnnouncementTicker announcements={announcements} variant="bar" />
    </div>
  );
}
