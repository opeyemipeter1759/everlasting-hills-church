"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import type { SessionUser } from "./DashboardShell";
import ThemeToggle from "@/components/theme/ThemeToggle";

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
  "/dashboard/sermons":                  "Sermons",
  "/dashboard/sermons/new":              "New Sermon",
  "/dashboard/sermons/analytics":        "Sermon Analytics",
  "/dashboard/subscribers":              "Sermon Subscribers",
  "/dashboard/giving":                   "Giving",
  "/dashboard/analytics":                "Analytics",
  "/dashboard/analytics/attendance":     "Attendance Analytics",
  "/dashboard/analytics/growth":         "Growth Analytics",
  "/dashboard/analytics/first-timers":   "First-Timer Analytics",
  "/dashboard/analytics/engagement":     "Engagement Scoring",
  "/dashboard/analytics/departments":    "Department Performance",
  "/dashboard/analytics/giving":         "Giving Analytics",
  "/dashboard/alerts":                   "Pastoral Alerts",
  "/dashboard/reports":                  "Reports & Exports",
  "/dashboard/follow-ups":              "Follow-ups",
  "/dashboard/settings":                "Settings",
  "/dashboard/audit-log":               "Audit Log",
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
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/8 flex items-center gap-4 px-4 sm:px-6 flex-shrink-0 transition-colors">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-base sm:text-[17px] font-bold text-gray-900 dark:text-white truncate">
        {title}
      </h1>

      {/* Right actions */}
      <ThemeToggle />
      <button
        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400"
        aria-label="Notifications"
      >
        <Bell size={18} />
      </button>
    </header>
  );
}
