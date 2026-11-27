"use client";

import { useEffect, useState } from "react";

/**
 * The time, ticking once a minute. Starts at the moment the server rendered
 * the page, so the first client render matches the server's HTML exactly,
 * then moves to the real clock.
 */
export function useNow(renderedAt: string): Date {
  const [now, setNow] = useState(() => new Date(renderedAt));
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
