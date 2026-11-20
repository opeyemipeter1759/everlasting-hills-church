import { BookHeart, CalendarClock, ClipboardList, LayoutGrid, Settings2 } from "lucide-react";
import type { NavGroup } from "./config";

/**
 * Marriage: pre-marital counselling. Shown to the pastors, Super Admins and
 * the Marriage Ministry team, and to counsellors with a case (Overview,
 * Applications, Sessions). The API decides what each person actually sees.
 */
export const MARRIAGE_NAV: NavGroup = {
  section: "Marriage",
  items: [
    { label: "Overview", href: "/dashboard/marriage", icon: LayoutGrid, minRole: "MEMBER", requiresAccess: "marriage" },
    { label: "Applications", href: "/dashboard/marriage/applications", icon: ClipboardList, minRole: "MEMBER", requiresAccess: "marriage" },
    { label: "Sessions", href: "/dashboard/marriage/sessions", icon: CalendarClock, minRole: "MEMBER", requiresAccess: "marriage" },
    { label: "Curriculum", href: "/dashboard/marriage/curriculum", icon: BookHeart, minRole: "MEMBER", requiresAccess: "marriageStaff" },
    { label: "Policy", href: "/dashboard/marriage/settings", icon: Settings2, minRole: "MEMBER", requiresAccess: "marriageStaff" },
  ],
};
