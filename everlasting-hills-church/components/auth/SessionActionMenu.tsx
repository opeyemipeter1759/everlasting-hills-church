"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { DropdownDivider } from "@/components/ui/dropdown/DropdownDivider";
import {
  clearFrontendSession,
  getFrontendSessionUser,
  normalizeRole,
  SESSION_CHANGED_EVENT,
  type FrontendSessionUser,
} from "@/lib/auth/frontend-session";
import { ROLE_LABELS } from "@/config/config";
import { useMe } from "@/lib/api";

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


  useEffect(() => {
    setSession(getFrontendSessionUser());
    const refresh = () => setSession(getFrontendSessionUser());
    window.addEventListener(SESSION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, refresh);
  }, []);
  // The cookie's role is a snapshot from login — if an admin promotes/demotes
  // this user mid-session, it goes stale until they log in again. /auth/me
  // computes the role fresh from the DB on every request, so prefer it once it
  // has loaded; fall back to the cookie so the badge doesn't flash empty first.
  const { data: me } = useMe({ enabled: !!session?.loggedIn });
  const role = normalizeRole(me?.role ?? session?.role ?? null);
  // "Worker" is a display-only distinction, not a real role: a plain MEMBER who
  // also belongs to a unit (but isn't its lead — that's UNIT_LEAD, a real role).
  const isWorker = role === "MEMBER" && (me?.member?.units?.length ?? 0) > 0;
  const roleLabel = isWorker ? "Worker" : role ? ROLE_LABELS[role] : session?.email;
  const dashboardLabel = pathname?.startsWith("/dashboard") ? "Home" : "Dashboard";
  const dashboardTargetHref = pathname?.startsWith("/dashboard") ? "/" : dashboardHref;

  // Dismissal (outside click / Escape) is handled by the shared Dropdown; the trigger
  // carries `.dropdown-toggle` so its own click toggles rather than being treated as
  // an outside click.

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
        aria-haspopup="menu"
        className={`dropdown-toggle ${loggedInTriggerClassName}`}
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
            {roleLabel}
          </span>
        </span>

        <ChevronDown
          size={16}
          strokeWidth={2.3}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <Dropdown isOpen={open} onClose={closeMenu} className={menuClassName || "w-56"}>
        {/* Identity header — name + role, matching the "dropdown with divider" pattern. */}
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold text-[#111] dark:text-white">{displayName}</p>
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-[#8a7e80] dark:text-white/40">
            {role ? ROLE_LABELS[role] : session.email}
          </p>
        </div>

        <DropdownDivider />

        <DropdownItem tag="a" href={dashboardTargetHref} icon={LayoutDashboard} onItemClick={handleNavigate}>
          {dashboardLabel}
        </DropdownItem>
        <DropdownItem tag="a" href={profileHref} icon={UserRound} onItemClick={handleNavigate}>
          Profile
        </DropdownItem>

        <DropdownDivider />

        <DropdownItem icon={LogOut} danger onClick={handleLogout}>
          Logout
        </DropdownItem>
      </Dropdown>
    </div>
  );
}