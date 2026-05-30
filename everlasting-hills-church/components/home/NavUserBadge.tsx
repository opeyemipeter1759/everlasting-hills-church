"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import {
  getFrontendSessionUser,
  type FrontendSessionUser,
} from "@/lib/auth/frontend-session";
import { auth } from "@/lib/api";

/**
 * Compact session indicator for the public navbar.
 *
 * Reads the unified session cookies CLIENT-side (we can't do that in a Server Component
 * because cookies() in next/headers is request-scoped and we're inside the layout-level
 * Navbar). On first paint it shows nothing (avoids a hydration mismatch) — the session
 * resolves in useEffect.
 *
 * Two visual states:
 *   - Authenticated → avatar/initial chip + dropdown (My dashboard / Sign out)
 *   - Anonymous     → null (parent renders the Login + Join-us buttons)
 *
 * `scrolled` mirrors the parent navbar's color theme so the chip's contrast matches.
 */
export default function NavUserBadge({ scrolled }: { scrolled: boolean }) {
  const router = useRouter();
  const [session, setSession] = useState<FrontendSessionUser | null>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSession(getFrontendSessionUser());
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!session?.loggedIn) return null;

  const displayName =
    session.fullName ?? session.email?.split("@")[0] ?? "Member";
  const initial = (session.fullName?.[0] ?? session.email?.[0] ?? "M").toUpperCase();
  const roleLabel = formatRole(session.role);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await auth.logout();
    } catch {
      // ignore — clearFrontendSession runs in auth.logout's finally
    } finally {
      setSigningOut(false);
      setOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div ref={dropdownRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-2.5 px-2 py-1.5 rounded-full transition-colors duration-200 ${
          scrolled
            ? "hover:bg-[#87102C]/5 text-[#222]"
            : "hover:bg-white/10 text-white/95"
        }`}
      >
        {session.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.picture}
            alt=""
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30"
          />
        ) : (
          <span className="w-9 h-9 rounded-full bg-[#87102C] text-white flex items-center justify-center text-sm font-bold ring-2 ring-white/30">
            {initial}
          </span>
        )}
        <span className="text-sm font-semibold leading-tight max-w-[140px] truncate">
          {displayName}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden z-50"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{session.email ?? ""}</p>
            {roleLabel && (
              <p className="text-[10px] mt-1 font-bold uppercase tracking-wider text-[#87102C]">
                {roleLabel}
              </p>
            )}
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <LayoutDashboard size={15} className="text-gray-400" />
            My dashboard
          </Link>
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <User size={15} className="text-gray-400" />
            My profile
          </Link>

          <div className="border-t border-gray-100" />
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            role="menuitem"
          >
            <LogOut size={15} />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatRole(role: string | null): string | null {
  if (!role) return null;
  return role.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Hook variant — small wrapper that lets parent components know if the user is logged in
 * so they can hide the "Login" / "Join us Sunday" CTAs when authenticated.
 */
export function useIsLoggedIn(): boolean | null {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    setLoggedIn(getFrontendSessionUser()?.loggedIn ?? false);
  }, []);
  return loggedIn;
}
