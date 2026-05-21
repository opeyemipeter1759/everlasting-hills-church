"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import type { SessionUser } from "./DashboardShell";

const PATH_TITLES: Record<string, string> = {
  "/dashboard":                 "Dashboard",
  "/dashboard/profile":         "My Profile",
  "/dashboard/attendance":      "Attendance",
  "/dashboard/prayer-requests": "Prayer Requests",
  "/dashboard/testimonies":     "Testimonies",
  "/dashboard/members":         "Members",
  "/dashboard/first-timers":    "First Timers",
  "/dashboard/services":        "Services",
  "/dashboard/events":          "Events",
  "/dashboard/submissions":     "Submissions",
  "/dashboard/announcements":   "Announcements",
  "/dashboard/inventory":       "Inventory",
  "/dashboard/units":           "Units",
  "/dashboard/sermons":         "Sermons",
  "/dashboard/giving":          "Giving",
  "/dashboard/analytics":       "Analytics",
  "/dashboard/follow-ups":      "Follow-ups",
  "/dashboard/settings":        "Settings",
  "/dashboard/audit-log":       "Audit Log",
};

function getTitle(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];

  if (/^\/dashboard\/members\/.+$/.test(pathname)) return "Member Profile";

  const last = pathname.split("/").at(-1) ?? "";
  return last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  user: SessionUser;
  onMenuClick: () => void;
};

export default function TopBar({ user: _user, onMenuClick }: Props) {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 sm:px-6 flex-shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-base sm:text-[17px] font-bold text-gray-900 truncate">
        {title}
      </h1>

      {/* Right actions */}
      <button
        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        aria-label="Notifications"
      >
        <Bell size={18} />
      </button>
    </header>
  );
}
