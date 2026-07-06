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
import type { UserRole } from "./role-utils";

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
    section: "Member",
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
      { label: "My Unit", href: "/dashboard/unit-lead", icon: Users, minRole: "UNIT_LEAD" },
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
