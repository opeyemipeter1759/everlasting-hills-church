"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCarouselOptions {
  length: number;
  delay?: number;
  autoPlay?: boolean;
}

export function useCarousel({ length, delay = 5000, autoPlay = true }: UseCarouselOptions) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (i: number) => setActive(((i % length) + length) % length),
    [length]
  );
  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (!autoPlay || paused) return;
    timerRef.current = setTimeout(next, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, paused, autoPlay, delay, next]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return { active, goTo, next, prev, paused, setPaused };
}
