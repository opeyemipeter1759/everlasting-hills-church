"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import {
  clearFrontendSession,
  getFrontendSessionUser,
  normalizeRole,
  SESSION_CHANGED_EVENT,
  type FrontendSessionUser,
} from "@/lib/auth/frontend-session";
import { ROLE_LABELS } from "@/config/config";

type LoggedOutMode = "both" | "login-only" | "none";

type Props = {
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  loggedOutMode?: LoggedOutMode;
  joinHref?: string;
  loginHref?: string;
  dashboardHref?: string;
  profileHref?: string;
  onNavigate?: () => void;
};

function getInitials(user: FrontendSessionUser): string {
  const source = (user.fullName ?? user.email ?? "").trim();
  if (!source) return "EH";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export default function SessionActionMenu({
  className = "",
  triggerClassName = "",
  menuClassName = "",
  loggedOutMode = "both",
  joinHref = "/#services",
  loginHref = "/login",
  dashboardHref = "/dashboard",
  profileHref = "/dashboard/profile",
  onNavigate,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<FrontendSessionUser | null>(null);

  // Hydrate from cookies on mount, then re-read whenever the session cookies change
  // (e.g. user updated their profile photo or name in /dashboard/settings).
  useEffect(() => {
    setSession(getFrontendSessionUser());
    const refresh = () => setSession(getFrontendSessionUser());
    window.addEventListener(SESSION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, refresh);
  }, []);
  const role = normalizeRole(session?.role ?? null);
  const dashboardLabel = pathname?.startsWith("/dashboard") ? "Home" : "Dashboard";
  const dashboardTargetHref = pathname?.startsWith("/dashboard") ? "/" : dashboardHref;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closeMenu = () => setOpen(false);
  const handleNavigate = () => {
    closeMenu();
    onNavigate?.();
  };

  const handleLogout = async () => {
    clearFrontendSession();
    handleNavigate();
    router.push("/login");
    router.refresh();
  };

  const displayName = session?.fullName ?? session?.email ?? "Guest";
  const userInitials = session ? getInitials(session) : "EH";
  const loggedInTriggerClassName =
    triggerClassName ||
    "group  gap-2  bg-white px-3 py-2 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5  dark:bg-gray-900";

  if (!session?.loggedIn) {
    if (loggedOutMode === "none") return null;

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Link
          href={loginHref}
          onClick={handleNavigate}
          className={"inline-flex w-[100px]  items-center justify-center rounded text-white bg-[#87102C] px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10"}
        >
          Login
        </Link>
        {loggedOutMode === "both" && (
          <a
            href={joinHref}
            onClick={handleNavigate}
            className="inline-flex items-center justify-center rounded bg-[#87102C] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6E0C24] hover:shadow-lg hover:shadow-burgundy/20 hover:-translate-y-0.5"
          >
            Join This Sunday
          </a>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={loggedInTriggerClassName}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md text-[12px] font-bold text-[#87102C] dark:bg-[#87102C]/20 dark:text-red-200">
          {session.picture ? (
            <img src={session.picture} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            userInitials
          )}
        </span>

        <span className="hidden min-w-0 flex-col leading-tight sm:flex items-start  ">
          <span className="truncate text-[13px] font-semibold  dark:text-white">
            {displayName}
          </span>
          <span className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            {role ? ROLE_LABELS[role] : session.email}
          </span>
        </span>

        <ChevronDown
          size={16}
          strokeWidth={2.3}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`absolute right-0 top-[calc(100%+10px)] z-50  overflow-hidden rounded-lg border border-gray-200 bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)] dark:border-gray-800 dark:bg-gray-950 ${menuClassName}`}
          >
         

            <div className="mt-2 space-y-1.5">
              <Link
                href={dashboardTargetHref}
                onClick={handleNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <LayoutDashboard size={16} />
                <span>{dashboardLabel}</span>
              </Link>
              <Link
                href={profileHref}
                onClick={handleNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <UserRound size={16} />
                <span>Profile</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}