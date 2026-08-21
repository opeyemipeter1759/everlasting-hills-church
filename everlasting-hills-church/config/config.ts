// ── CHURCH CONFIG — update these ──
export const CHURCH = {
  name: "Everlasting Hills Church",
  address: "Ibadan, Oyo State, Nigeria",
  lat: 7.3775,
  lng: 3.9470,
  youtubeUrl: "https://youtube.com/@everlastinghillschurch?si=3ftJeVz2a6F7Hu3g",
  phone: "+234 706 872 7719",
  email: "hello@everlastinghills.org",
  whatsappUrl: "https://wa.me/2347068727719",
};

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
  | "ADMIN_HEAD"
  | "HOD"
  | "HEAD_USHER"
  | "UNIT_LEAD"
  | "MEMBER"
  | "VISITOR";

// Admin merged into Admin Head — same level, full church-wide access. ADMIN is
// legacy (kept only so existing grants keep working); ADMIN_HEAD is the name
// used going forward.
const LEVELS: Record<UserRole, number> = {
  VISITOR: 0,
  MEMBER: 1,
  UNIT_LEAD: 2,
  HEAD_USHER: 3,
  HOD: 4,
  ADMIN_HEAD: 6,
  ADMIN: 6,
  PASTOR: 7,
  SUPER_ADMIN: 8,
};

const CHURCH_WIDE_ROLES = new Set<UserRole>(["ADMIN", "ADMIN_HEAD", "PASTOR", "SUPER_ADMIN"]);
const LATERAL_ROLES = new Set<UserRole>(["HOD", "HEAD_USHER"]);

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  if (LATERAL_ROLES.has(minRole)) {
    return userRole === minRole || CHURCH_WIDE_ROLES.has(userRole);
  }
  if (LATERAL_ROLES.has(userRole)) {
    return minRole === "MEMBER" || minRole === "VISITOR";
  }
  return (LEVELS[userRole] ?? 0) >= (LEVELS[minRole] ?? 0);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  PASTOR: "Pastor",
  ADMIN: "Admin Head",
  ADMIN_HEAD: "Admin Head",
  HOD: "Head of Department",
  HEAD_USHER: "Head Usher",
  UNIT_LEAD: "Unit Lead",
  MEMBER: "Member",
  VISITOR: "Visitor",
};

export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  PASTOR: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  ADMIN: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  ADMIN_HEAD: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  HOD: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
  HEAD_USHER: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
  UNIT_LEAD: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  MEMBER: "bg-white/10 text-white/70 border border-white/10",
  VISITOR: "bg-white/10 text-white/70 border border-white/10",
};

import {
  PanelsTopLeft,
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
  CalendarRange,
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
  Tally5,
  Building2,
  GraduationCap,
  Compass,
  Users2,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  minRole: UserRole;
  maxRole?: UserRole;
  /** Extra data-driven visibility check beyond the static role gate — e.g. a
   * UNIT_LEAD-role user who doesn't actually lead a real unit shouldn't see
   * "My Unit"; a plain MEMBER who is genuinely on a team should see "Follow Up". */
  requiresAccess?: "unitLead" | "unitMember" | "followUp";
  /** Expanded into one nav item per unit (label = unit name, href =
   * `${href}/${unit.id}`) instead of rendered as a single static link — see
   * AppSidebar.tsx. "lead" sources from units the user leads/assists, "member"
   * from units they're a plain member of. */
  dynamicUnits?: "lead" | "member";
};

export type NavGroup = {
  section: string | null;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    section: null,
    items: [
      { label: "Home",            href: "/dashboard/admin",            icon: LayoutDashboard, minRole: "ADMIN" },
      { label: "Prayer Requests", href: "/dashboard/prayer-requests",  icon: Heart,           minRole: "ADMIN" },
      { label: "Testimonials",    href: "/dashboard/testimonies",     icon: MessageSquare,   minRole: "ADMIN" },
      { label: "Questions",       href: "/dashboard/questions",       icon: MessageSquare,   minRole: "ADMIN" },
    ],
  },
  {
    section: "My Unit",
    items: [
      { label: "My Unit", href: "/dashboard/unit-lead", icon: Users, minRole: "UNIT_LEAD", requiresAccess: "unitLead", dynamicUnits: "lead" },
    ],
  },
    {
    section: "Follow up",
    items: [
      { label: "Follow Up", href: "/dashboard/follow-up", icon: Users, minRole: "UNIT_LEAD", requiresAccess: "followUp" },
    ],
  },
  {
    section: "My Department",
    items: [
      { label: "My Department", href: "/dashboard/my-department", icon: Building2, minRole: "HOD" },
      { label: "Reports", href: "/dashboard/my-department/reports", icon: FileText, minRole: "ADMIN_HEAD" },
    ],
  },
  {
    section: "Administration",
    items: [
      { label: "People",        href: "/dashboard/admin/members",       icon: Users,         minRole: "ADMIN" },
      { label: "First Timers",  href: "/dashboard/admin/first-timers",  icon: UserPlus,      minRole: "ADMIN" },
      { label: "Online Audience", href: "/dashboard/admin/online-audience", icon: Wifi, minRole: "ADMIN" },
      { label: "Services",      href: "/dashboard/admin/services",      icon: Calendar,      minRole: "ADMIN" },
      { label: "Attendance",    href: "/dashboard/admin/attendance",    icon: ClipboardList, minRole: "ADMIN" },
      { label: "Events",        href: "/dashboard/admin/events",        icon: CalendarDays,  minRole: "ADMIN" },
      { label: "Calendar",      href: "/dashboard/admin/calendar",      icon: CalendarRange, minRole: "ADMIN" },
      { label: "Usher",         href: "/dashboard/admin/usher",         icon: Tally5,        minRole: "HEAD_USHER" },
      { label: "Announcements", href: "/dashboard/admin/announcements", icon: Megaphone,     minRole: "ADMIN" },
      { label: "Emails",        href: "/dashboard/admin/emails",        icon: Mail,          minRole: "ADMIN" },
      { label: "Inventory",     href: "/dashboard/admin/inventory",     icon: Package,       minRole: "ADMIN" },
      { label: "Departments",   href: "/dashboard/admin/departments",   icon: Building2,     minRole: "ADMIN" },
      { label: "Units",         href: "/dashboard/admin/units",         icon: Network,       minRole: "ADMIN" },
      { label: "Roles",         href: "/dashboard/admin/roles",         icon: Shield,        minRole: "ADMIN" },
      { label: "Courses",       href: "/dashboard/admin/courses",       icon: GraduationCap, minRole: "ADMIN" },
      { label: "Home Cell",     href: "/dashboard/admin/home-cell",     icon: Compass,       minRole: "ADMIN" },
      // { label: "Homepage",      href: "/dashboard/settings/homepage", icon: Settings,  minRole: "ADMIN" },
      { label: "Public Site (CMS)", href: "/dashboard/cms",          icon: PanelsTopLeft, minRole: "PASTOR" },
    ],
  },
  {
    section: "Analytics",
    items: [
      { label: "Attendance",    href: "/dashboard/analytics/attendance",    icon: ClipboardList, minRole: "ADMIN" },
      { label: "Growth",        href: "/dashboard/analytics/growth",        icon: TrendingUp,    minRole: "ADMIN" },
      { label: "First Timers",  href: "/dashboard/analytics/first-timers",  icon: UserPlus,      minRole: "ADMIN" },
     //{ label: "Departments",   href: "/dashboard/analytics/departments",   icon: Network,       minRole: "UNIT_LEAD" },
     // { label: "Engagement",    href: "/dashboard/analytics/engagement",    icon: Activity,      minRole: "PASTOR" },
     // { label: "Giving",        href: "/dashboard/analytics/giving",        icon: DollarSign,    minRole: "PASTOR" },
    ],
  },
  {
    section: "Pastoral",
    items: [
      { label: "Sermons",           href: "/dashboard/pastor/sermons",            icon: BookOpen,       minRole: "PASTOR" },
      { label: "Sermon Analytics",  href: "/dashboard/pastor/sermons/analytics",  icon: BarChart3,      minRole: "PASTOR" },/* 
      { label: "Alerts",            href: "/dashboard/alerts",             icon: Bell,           minRole: "PASTOR" },
      { label: "Follow-ups",        href: "/dashboard/pastor/follow-ups",         icon: PhoneForwarded, minRole: "PASTOR" },
      { label: "Giving",            href: "/dashboard/giving",             icon: DollarSign,     minRole: "PASTOR" },
     */  { label: "Reports",           href: "/dashboard/pastor/reports",            icon: FileText,       minRole: "PASTOR" },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Audit Log", href: "/dashboard/audit-log", icon: Shield, minRole: "SUPER_ADMIN" },
    ],
  },{
    section: "Member",
    items: [
      { label: "Home",           href: "/dashboard",            icon: BookOpen,       minRole: "MEMBER" },
      { label: "Attendance",     href: "/dashboard/attendance", icon: CheckCircle,    minRole: "MEMBER" },
      { label: "Sermons",      href: "/dashboard/sermon",          icon: BookOpen,            minRole: "MEMBER" },
      { label: "My Course",           href: "/dashboard/courses",            icon: GraduationCap,       minRole: "MEMBER" },
      { label: "Explore Course",           href: "/dashboard/explore-courses",            icon: Compass,       minRole: "MEMBER" },
      { label: "Unit", href: "/dashboard/unit", icon: Users2, minRole: "MEMBER", requiresAccess: "unitMember", dynamicUnits: "member" },

      { label: "My Profile",      href: "/dashboard/profile",          icon: User,            minRole: "MEMBER" },

    ],
  },
  
];
