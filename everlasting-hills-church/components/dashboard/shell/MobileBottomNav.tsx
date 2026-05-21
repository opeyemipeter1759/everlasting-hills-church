"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  CheckCircle,
  Heart,
  Users,
  UserPlus,
  BookOpen,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { hasMinRole } from "./role-utils";
import type { UserRole } from "./role-utils";
import type { SessionUser } from "./DashboardShell";

type BottomTab = {
  label: string;
  href: string;
  icon: React.ElementType;
  minRole: UserRole;
  maxRole?: UserRole;
};

const BOTTOM_TABS: BottomTab[] = [
  { label: "Home",       href: "/dashboard",               icon: LayoutDashboard, minRole: "MEMBER" },
  { label: "Profile",    href: "/dashboard/profile",       icon: User,            minRole: "MEMBER",  maxRole: "ADMIN" },
  { label: "Attendance", href: "/dashboard/attendance",    icon: CheckCircle,     minRole: "MEMBER",  maxRole: "ADMIN" },
  { label: "Prayer",     href: "/dashboard/prayer-requests",icon: Heart,          minRole: "MEMBER",  maxRole: "ADMIN" },
  { label: "Testimony",  href: "/dashboard/testimonies",   icon: MessageSquare,   minRole: "MEMBER",  maxRole: "ADMIN" },
  { label: "Members",    href: "/dashboard/members",       icon: Users,           minRole: "ADMIN" },
  { label: "1st Timers", href: "/dashboard/first-timers",  icon: UserPlus,        minRole: "ADMIN",   maxRole: "PASTOR" },
  { label: "Sermons",    href: "/dashboard/sermons",       icon: BookOpen,        minRole: "PASTOR" },
  { label: "Analytics",  href: "/dashboard/analytics",     icon: BarChart3,       minRole: "PASTOR" },
];

export default function MobileBottomNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  const tabs = BOTTOM_TABS.filter((tab) => {
    if (!hasMinRole(user.role, tab.minRole)) return false;
    if (tab.maxRole && hasMinRole(user.role, tab.maxRole)) return false;
    return true;
  }).slice(0, 5);

  if (tabs.length === 0) return null;

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-1",
                "transition-colors duration-150",
                active ? "text-[#87102C]" : "text-gray-400",
              ].join(" ")}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium leading-none truncate max-w-full">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
