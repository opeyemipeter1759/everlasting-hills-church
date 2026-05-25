"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { clearFrontendSession } from "@/lib/auth/frontend-session";
import { hasMinRole, ROLE_LABELS, ROLE_BADGE_CLASS } from "./role-utils";
import { NAV_GROUPS } from "./nav-config";
import type { SessionUser } from "./DashboardShell";

type Props = {
  user: SessionUser;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function getInitials(user: SessionUser): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) return user.firstName[0].toUpperCase();
  return user.email[0].toUpperCase();
}

function getDisplayName(user: SessionUser): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.email;
}

export default function Sidebar({ user, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    clearFrontendSession();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!hasMinRole(user.role, item.minRole)) return false;
      if (item.maxRole && hasMinRole(user.role, item.maxRole)) return false;
      return true;
    }),
  })).filter((g) => g.items.length > 0);

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] flex flex-col",
        "transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
      ].join(" ")}
      aria-label="Main navigation"
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#87102C] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-[10px] tracking-tight">EHC</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">
            Everlasting Hills
          </p>
          <p className="text-white/25 text-[10px] leading-tight">Church Platform</p>
        </div>
        <button
          onClick={onMobileClose}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Nav items ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5 scrollbar-thin">
        {visibleGroups.map((group) => (
          <div key={group.section ?? "__personal"}>
            {group.section && (
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/20 px-3 mb-1.5">
                {group.section}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={onMobileClose}
                    className={[
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                      "transition-all duration-150",
                      active
                        ? "bg-[#87102C] text-white"
                        : "text-white/50 hover:text-white hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    <Icon
                      size={15}
                      className={`flex-shrink-0 ${active ? "text-white" : "text-white/35"}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User section ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2">
          <div className="w-8 h-8 rounded-full bg-[#87102C] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {getInitials(user)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">
              {getDisplayName(user)}
            </p>
            <p className="text-white/30 text-xs truncate leading-tight">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE_CLASS[user.role]}`}
          >
            {ROLE_LABELS[user.role]}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/25 hover:text-white/60 transition-colors text-xs"
            aria-label="Sign out"
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
