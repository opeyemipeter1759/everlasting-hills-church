"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const CHECK_EVERY_MS = 5 * 60 * 1000;
const MINE = process.env.NEXT_PUBLIC_BUILD_ID ?? null;

/** True when the server is running a different build from this page's. */
export async function newerBuildOut(fetcher: typeof fetch = fetch): Promise<boolean> {
  if (!MINE) return false;
  try {
    const res = await fetcher("/api/version", { cache: "no-store" });
    if (!res.ok) return false;
    const { build } = (await res.json()) as { build: string | null };
    return !!build && build !== MINE;
  } catch {
    return false; // offline or the server is restarting: try again later
  }
}

/**
 * Keeps an open app on the latest version without anyone refreshing. It checks
 * for a new deploy every few minutes and whenever the tab comes back into view,
 * and once there is one, reloads at the next page change, so nothing being
 * typed is ever thrown away.
 */
export function VersionWatcher() {
  const pathname = usePathname();
  const stale = useRef(false);
  const first = useRef(true);

  useEffect(() => {
    const check = async () => {
      if (!stale.current && (await newerBuildOut())) stale.current = true;
    };
    const onVisible = () => document.visibilityState === "visible" && void check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // A page change is the moment nothing is half-typed: load the new version then.
    if (stale.current) window.location.reload();
  }, [pathname]);

  return null;
}
