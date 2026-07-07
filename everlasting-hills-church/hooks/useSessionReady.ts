"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "./useCurrentUser";
import type { FrontendSessionUser } from "@/lib/auth/frontend-session";

/**
 * Wraps useCurrentUser with a `ready` flag that flips true after the first
 * client-side check, so callers can hold a loading state instead of
 * flashing the signed-out view before hydration resolves the real session.
 */
export function useSessionReady(): { user: FrontendSessionUser | null; ready: boolean } {
  const user = useCurrentUser();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return { user, ready };
}
