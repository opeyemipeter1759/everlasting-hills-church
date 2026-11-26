"use client";

import { AnnouncementTicker } from "@/components/announcements/AnnouncementTicker";
import { useAnnouncementsFeed, useSessionReady } from "@/hooks";

/**
 * The church's announcements for a signed-in member, as a bar across the whole
 * screen pinned just under the navbar (over the top of the hero), so it stays in
 * view while the page scrolls, like the navbar does. It scrolls like a shop's
 * sale banner. Nothing shows for a visitor who is not signed in, or until there
 * are announcements.
 */
export default function HomeAnnouncementBar() {
  const { user, ready } = useSessionReady();
  const signedIn = ready && !!user?.loggedIn;
  const { announcements } = useAnnouncementsFeed(signedIn);
  if (!signedIn || announcements.length === 0) return null;
  // top-16 / md:top-20 match the navbar's height; z-40 keeps it under the navbar's menus (z-50).
  return (
    <div className="fixed inset-x-0 top-16 z-40 md:top-20">
      <AnnouncementTicker announcements={announcements} variant="bar" />
    </div>
  );
}
