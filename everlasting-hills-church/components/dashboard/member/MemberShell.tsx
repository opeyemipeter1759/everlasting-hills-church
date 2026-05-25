"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, User, CalendarCheck, BookOpen, Sparkles,
  Menu, X, Search, Bell, Settings,
} from "lucide-react";
import { clearFrontendSession } from "@/lib/auth/frontend-session";
import ThemeToggle from "@/components/theme/ThemeToggle";

// ── Types ─────────────────────────────────────────────────────────────────────

type ShellProps = {
  memberDisplayId: string;
  displayName: string;
  initials: string;
  email: string;
  children: React.ReactNode;
};

type SidebarProps = Omit<ShellProps, "children"> & {
  mobileOpen: boolean;
  onClose: () => void;
};

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV = [
  { label: "Home",             href: "/me",              icon: LayoutDashboard, exact: true  },
  { label: "My Profile",       href: "/me",              icon: User,            exact: false },
  { label: "Attendance",       href: "/me",              icon: CalendarCheck,   exact: false },
  { label: "Prayer Requests",  href: "/prayer-request",  icon: BookOpen,        exact: false },
  { label: "Testimonies",      href: "/testimony",       icon: Sparkles,        exact: false },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

function MemberSidebar({ memberDisplayId: _id, displayName, initials, email: _email, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    clearFrontendSession();
    router.push("/login");
    router.refresh();
  };

  const isActive = (item: typeof NAV[0]) => {
    if (item.exact) return pathname === item.href;
    if (item.href === "/me") return false;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] flex flex-col",
        "transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
      ].join(" ")}
      aria-label="Member navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#87102C] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-[11px] tracking-tight">EH</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[11px] uppercase tracking-wide leading-tight">
            Everlasting Hills
          </p>
          <p className="text-white/25 text-[9px] uppercase tracking-widest">Church Platform</p>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-[#87102C] text-white"
                  : "text-white/50 hover:text-white hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <Icon size={15} className={`flex-shrink-0 ${active ? "text-white" : "text-white/35"}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-[#87102C] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">{displayName}</p>
            <p className="text-white/30 text-[10px] uppercase tracking-wide font-medium">Member</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/60 transition-colors"
            aria-label="Settings / Sign out"
            title="Sign out"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/me":              "Home",
  "/prayer-request":  "Prayer Requests",
  "/testimony":       "Testimonies",
};

export default function MemberShell({ memberDisplayId, displayName, initials, email, children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const pageTitle = PAGE_TITLES[pathname] ?? "Home";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] transition-colors">
      <MemberSidebar
        memberDisplayId={memberDisplayId}
        displayName={displayName}
        initials={initials}
        email={email}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/8 flex items-center gap-3 px-4 sm:px-6 flex-shrink-0 transition-colors">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
            <span>Everlasting Hills</span>
            <span className="text-gray-300 dark:text-gray-600">›</span>
            <span>Dashboard</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-white/10" />

          <h1 className="text-sm font-bold text-gray-900 dark:text-white">{pageTitle}</h1>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 w-44">
            <Search size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              placeholder="Search..."
              className="bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 outline-none w-full"
            />
          </div>

          {/* Member ID chip */}
          <span className="hidden sm:inline-flex items-center text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 tabular-nums">
            {memberDisplayId}
          </span>

          <ThemeToggle />

          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
