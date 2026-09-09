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
 * count down to. Fires `onComplete` exactly once, the instant it crosses
 * zero — lets the caller refetch "can I check in now?" right as the window
 * opens instead of leaving a stale countdown frozen at 00:00:00.
 */
export function useCountdown(targetIso: string | null, onComplete?: () => void): Countdown | null {
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    if (!targetIso) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const totalMs = targetIso ? Math.max(0, new Date(targetIso).getTime() - now) : 0;

  useEffect(() => {
    if (targetIso && totalMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      onComplete?.();
    }
  }, [targetIso, totalMs, onComplete]);

  if (!targetIso) return null;

  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    totalMs,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
