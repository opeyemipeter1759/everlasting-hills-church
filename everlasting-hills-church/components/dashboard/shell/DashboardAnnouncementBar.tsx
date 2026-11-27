"use client";

import { usePathname } from "next/navigation";
import { AnnouncementTicker } from "@/components/announcements/AnnouncementTicker";
import { useAnnouncementsFeed } from "@/lib/api/announcements";

/**
 * The announcements strip on the dashboard home only (the other place it shows
 * is the public homepage). DashboardLayouts places it in the pinned header right
 * under the top bar, so it stays fixed with it, full width against the sidebar.
 * Same list as the announcements bell; nothing shows when empty.
 */
export default function DashboardAnnouncementBar() {
  const onHome = usePathname() === "/dashboard";
  const { data: announcements = [] } = useAnnouncementsFeed();
  if (!onHome || announcements.length === 0) return null;
  return <AnnouncementTicker announcements={announcements} variant="bar" />;
}
