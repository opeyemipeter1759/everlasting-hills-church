// ── CHURCH CONFIG — update these ──
export const CHURCH = {
  name: "Everlasting Hills Church",
  address: "Ibadan, Oyo State, Nigeria",
  lat: 7.3775,
  lng: 3.9470,
  youtubeUrl: "https://www.youtube.com/@yourchannel/live", // ← replace
};

// ── SERVICE SCHEDULE ──
// Sunday:    9:00 AM – 12:00 PM  (live window: 8:45 AM – 12:00 PM)
// Wednesday: 5:30 PM –  8:00 PM  (live window: 5:15 PM –  8:00 PM)
export const SERVICES = {
  sunday: {
    day: 0,
    startH: 9,  startM: 0,
    endH: 12,   endM: 0,
    liveStartH: 8, liveStartM: 45,
  },
  wednesday: {
    day: 3,
    startH: 17, startM: 30,
    endH: 20,   endM: 0,
    liveStartH: 17, liveStartM: 15,
  },
};

// ── Types ──
export type TravelMode = "driving" | "walking" | "transit";


export interface RouteInfo {
  distance: string;
  duration: string;
  mode: TravelMode;
}


export type UserRole =
  | "SUPER_ADMIN"
  | "PASTOR"
  | "ADMIN"
  | "UNIT_LEAD"
  | "MEMBER"
  | "VISITOR";

const LEVELS: Record<UserRole, number> = {
  VISITOR: 0,
  MEMBER: 1,
  UNIT_LEAD: 2,
  ADMIN: 3,
  PASTOR: 4,
  SUPER_ADMIN: 5,
};

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return (LEVELS[userRole] ?? 0) >= (LEVELS[minRole] ?? 0);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR: "Pastor",
  ADMIN: "Admin",
  UNIT_LEAD: "Unit Lead",
  MEMBER: "Member",
  VISITOR: "Visitor",
};

export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  PASTOR: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  ADMIN: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
  UNIT_LEAD: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  MEMBER: "bg-white/10 text-white/50 border border-white/10",
  VISITOR: "bg-white/10 text-white/50 border border-white/10",
};

import {
  LayoutDashboard,
  User,
  CheckCircle,
  Heart,
  MessageSquare,
  Users,
  UserPlus,
  Calendar,
  ClipboardList,
  CalendarDays,
  Inbox,
  Megaphone,
  Package,
  Network,
  BookOpen,
  DollarSign,
  BarChart3,
  PhoneForwarded,
  Settings,
  Shield,
  Mail,
  TrendingUp,
  Bell,
  FileText,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  minRole: UserRole;
  /** If set, hide this item when user role >= maxRole (exclusive upper bound). */
  maxRole?: UserRole;
};

export type NavGroup = {
  section: string | null;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    section: null,
    items: [
      { label: "Home",            href: "/dashboard",                  icon: LayoutDashboard, minRole: "MEMBER" },
      { label: "My Profile",      href: "/dashboard/profile",          icon: User,            minRole: "MEMBER" },
      { label: "My Attendance",   href: "/dashboard/attendance",       icon: CheckCircle,     minRole: "MEMBER", maxRole: "ADMIN" },
      { label: "Prayer Requests", href: "/dashboard/prayer-requests",  icon: Heart,           minRole: "MEMBER" },
      { label: "Testimonies",     href: "/dashboard/testimonies",      icon: MessageSquare,   minRole: "MEMBER" },
    ],
  },
  {
    section: "My Unit",
    items: [
      { label: "Unit Dashboard", href: "/dashboard/units", icon: Users, minRole: "UNIT_LEAD", maxRole: "ADMIN" },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "Members",       href: "/dashboard/members",       icon: Users,         minRole: "ADMIN" },
      { label: "First Timers",  href: "/dashboard/first-timers",  icon: UserPlus,      minRole: "ADMIN" },
      { label: "Services",      href: "/dashboard/services",      icon: Calendar,      minRole: "ADMIN" },
      { label: "Attendance",    href: "/dashboard/attendance",    icon: ClipboardList, minRole: "ADMIN" },
      { label: "Events",        href: "/dashboard/events",        icon: CalendarDays,  minRole: "ADMIN" },
      { label: "Submissions",   href: "/dashboard/submissions",   icon: Inbox,         minRole: "ADMIN" },
      { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone,     minRole: "ADMIN" },
      { label: "Inventory",     href: "/dashboard/inventory",     icon: Package,       minRole: "ADMIN" },
      { label: "Units",         href: "/dashboard/units",         icon: Network,       minRole: "ADMIN" },
      { label: "Settings",      href: "/dashboard/settings",      icon: Settings,      minRole: "ADMIN" },
    ],
  },
  {
    section: "Analytics",
    items: [
      { label: "Attendance",    href: "/dashboard/analytics/attendance",    icon: ClipboardList, minRole: "ADMIN" },
      { label: "Growth",        href: "/dashboard/analytics/growth",        icon: TrendingUp,    minRole: "ADMIN" },
      { label: "First Timers",  href: "/dashboard/analytics/first-timers",  icon: UserPlus,      minRole: "ADMIN" },
      { label: "Departments",   href: "/dashboard/analytics/departments",   icon: Network,       minRole: "UNIT_LEAD" },
      { label: "Engagement",    href: "/dashboard/analytics/engagement",    icon: Activity,      minRole: "PASTOR" },
      { label: "Giving",        href: "/dashboard/analytics/giving",        icon: DollarSign,    minRole: "PASTOR" },
    ],
  },
  {
    section: "Pastoral",
    items: [
      { label: "Sermons",           href: "/dashboard/sermons",            icon: BookOpen,       minRole: "PASTOR" },
      { label: "Sermon Analytics",  href: "/dashboard/sermons/analytics",  icon: BarChart3,      minRole: "PASTOR" },
      { label: "Subscribers",       href: "/dashboard/subscribers",        icon: Mail,           minRole: "PASTOR" },
      { label: "Testimonials",      href: "/dashboard/testimonials",       icon: MessageSquare,  minRole: "PASTOR" },
      { label: "Alerts",            href: "/dashboard/alerts",             icon: Bell,           minRole: "PASTOR" },
      { label: "Follow-ups",        href: "/dashboard/follow-ups",         icon: PhoneForwarded, minRole: "PASTOR" },
      { label: "Giving",            href: "/dashboard/giving",             icon: DollarSign,     minRole: "PASTOR" },
      { label: "Reports",           href: "/dashboard/reports",            icon: FileText,       minRole: "PASTOR" },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Audit Log", href: "/dashboard/audit-log", icon: Shield, minRole: "SUPER_ADMIN" },
    ],
  },
];
