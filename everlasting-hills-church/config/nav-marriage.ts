import { CalendarClock, ClipboardList, HeartHandshake, LayoutGrid, Settings2 } from "lucide-react";
import type { NavGroup, NavItem } from "./config";

/** A member's own pre-marital application (Member section), shown only to someone who has one. */
export const COUPLE_NAV_ITEM: NavItem = { label: "Pre-marital", href: "/dashboard/pre-marital", icon: HeartHandshake, minRole: "MEMBER", requiresAccess: "couple" };

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
    { label: "Policy", href: "/dashboard/marriage/settings", icon: Settings2, minRole: "MEMBER", requiresAccess: "marriageStaff" },
  ],
};
