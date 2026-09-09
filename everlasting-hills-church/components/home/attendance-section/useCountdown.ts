"use client";

import { useEffect, useRef, useState } from "react";

export interface Countdown {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Ticks down to `targetIso` once a second; null whenever there's nothing to
 * count down to, or before the client has actually mounted.
 *
 * That mounted-gate matters: seeding `now` from Date.now() during the very
 * first render would make the server-rendered HTML (built the instant the
 * request hit the server) disagree with the client's first render (built
 * moments later, at hydration time) — a hydration mismatch. Dev mode papers
 * over that silently; a production build does not, and can abort hydrating
 * that subtree, which is exactly what "works locally, broken in prod" looks
 * like for anything Date.now()-seeded. Returning null until mount keeps the
 * server and client's first paint byte-for-byte identical (all zeros); the
 * real countdown only starts ticking after hydration has already succeeded.
 */
export function useCountdown(targetIso: string | null, onComplete?: () => void): Countdown | null {
  const [now, setNow] = useState<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    if (!targetIso) {
      setNow(null);
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const totalMs = targetIso && now !== null ? Math.max(0, new Date(targetIso).getTime() - now) : null;

  useEffect(() => {
    if (targetIso && totalMs !== null && totalMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      onComplete?.();
    }
  }, [targetIso, totalMs, onComplete]);

  if (!targetIso || totalMs === null) return null;

  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    totalMs,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
