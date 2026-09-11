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
  CalendarClock,
  Megaphone,
  Package,
  Network,
  BookOpen,
  DollarSign,
  BarChart3,
  PhoneForwarded,
  Settings,
  Shield,
  TrendingUp,
  FileText,
  Activity,
  Building2,
  Bell,
  Headphones,
  ListChecks,
  History,
  Newspaper,
  UserCog,
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
  /**
   * Show only to people actually on a follow-up team, as answered by
   * GET /follow-up/access. Role alone cannot decide this: being on the team is
   * a unit assignment, not a rank, and the pipeline carries pastoral notes
   * about named people — it has no business appearing for every member who
   * happens to be in a unit.
   */
  requiresFollowUpAccess?: boolean;
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
      // Members had no nav entry for either of these: sermons were reachable
      // only from a dashboard card. They are tabbed together as one section,
      // and both are named here because a member looking for their reading plan
      // should not have to know it lives behind Sermons.
      { label: "Sermons",         href: "/dashboard/sermon",           icon: Headphones,      minRole: "MEMBER" },
      { label: "Bible Plan",      href: "/dashboard/reading",          icon: BookOpen,        minRole: "MEMBER" },
      // Member-written articles: what people are learning, published to the
      // church. It sits beside the reading plan because that is where most of
      // them start.
      { label: "Articles",        href: "/dashboard/articles",         icon: Newspaper,       minRole: "MEMBER" },
      { label: "Notifications",   href: "/dashboard/settings/notifications", icon: Bell,      minRole: "MEMBER" },
      { label: "Prayer Requests", href: "/prayer-request",             icon: Heart,           minRole: "MEMBER" },
      { label: "Testimonies",     href: "/testimony",                  icon: MessageSquare,   minRole: "MEMBER" },
    ],
  },
  {
    section: "My Unit",
    items: [
      { label: "My Unit", href: "/dashboard/unit-lead", icon: Users, minRole: "UNIT_LEAD" },
      // Follow-up belongs to the unit that does it, not to a module of its own.
      { label: "Follow-ups", href: "/dashboard/follow-up", icon: PhoneForwarded, minRole: "MEMBER", requiresFollowUpAccess: true },
    ],
  },
  {
    section: "My Department",
    items: [
      { label: "My Department", href: "/dashboard/my-department", icon: Building2, minRole: "HOD" },
    ],
  },
  {
    // Ushering is its own module, not an administrative screen: HEAD_USHER is a
    // role in its own right, and the people who hold it are not admins. Before
    // this the two usher pages sat under /dashboard/admin with no nav entry at
    // all, so a head usher signing in had no way to reach their own work.
    section: "Ushering",
    items: [
      { label: "Record Attendance", href: "/dashboard/usher",         icon: ClipboardList, minRole: "HEAD_USHER" },
      { label: "Missing Counts",    href: "/dashboard/usher/backlog", icon: ListChecks,    minRole: "HEAD_USHER" },
      { label: "Headcount History", href: "/dashboard/usher/history", icon: History,       minRole: "HEAD_USHER" },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "Members",       href: "/dashboard/admin/members",       icon: Users,         minRole: "ADMIN" },
      { label: "First Timers",  href: "/dashboard/admin/first-timers",  icon: UserPlus,      minRole: "ADMIN" },
      { label: "Service Teams", href: "/dashboard/admin/service-teams", icon: UserCog,       minRole: "ADMIN" },
      { label: "Services",      href: "/dashboard/admin/services",      icon: Calendar,      minRole: "ADMIN" },
      { label: "Attendance",    href: "/dashboard/admin/attendance",    icon: ClipboardList, minRole: "ADMIN" },
      { label: "Events",        href: "/dashboard/admin/events",        icon: CalendarDays,  minRole: "ADMIN" },
      { label: "Announcements", href: "/dashboard/admin/announcements", icon: Megaphone,     minRole: "ADMIN" },
      { label: "Gatherings",    href: "/dashboard/admin/gatherings", icon: CalendarClock, minRole: "ADMIN" },
      { label: "Inventory",     href: "/dashboard/admin/inventory", icon: Package,     minRole: "ADMIN" },
      { label: "Units",         href: "/dashboard/admin/units",   icon: Network,       minRole: "ADMIN" },
      // The Roles page existed with no way in but the URL — the third screen in
      // this app built and then left unreachable.
      { label: "Roles",         href: "/dashboard/admin/roles",   icon: Shield,        minRole: "ADMIN" },
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
      { label: "Sermons",           href: "/dashboard/pastor/sermons",            icon: BookOpen,       minRole: "PASTOR" },
      { label: "Sermon Analytics",  href: "/dashboard/pastor/sermons/analytics",  icon: BarChart3,      minRole: "PASTOR" },
      { label: "Follow-ups",        href: "/dashboard/pastor/follow-ups",         icon: PhoneForwarded, minRole: "PASTOR" },
      { label: "Testimonials",      href: "/dashboard/pastor/testimonials",       icon: MessageSquare,  minRole: "PASTOR" },
      { label: "Giving",            href: "/dashboard/giving",             icon: DollarSign,     minRole: "PASTOR" },
      { label: "Reports",           href: "/dashboard/pastor/reports",     icon: FileText,       minRole: "PASTOR" },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Audit Log", href: "/dashboard/audit-log", icon: Shield, minRole: "SUPER_ADMIN" },
    ],
  },
];
