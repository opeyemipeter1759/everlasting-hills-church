"use client";

import { useEffect, useRef } from "react";

/**
 * Slowly auto-scrolls a horizontally-overflowing container back and forth
 * (ping-pong), pausing while the user is actively touching/scrolling it
 * themselves. No-ops when the content doesn't overflow (e.g. wide screens)
 * or when the user prefers reduced motion.
 */
export function useAutoScroll<T extends HTMLElement>(speed = 0.4) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame: number;
    let paused = false;
    let direction = 1;
    let resumeTimeout: ReturnType<typeof setTimeout>;

    function step() {
      const max = el!.scrollWidth - el!.clientWidth;
      if (!paused && max > 0) {
        el!.scrollLeft += speed * direction;
        if (el!.scrollLeft >= max) direction = -1;
        else if (el!.scrollLeft <= 0) direction = 1;
      }
      frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);

    function pause() {
      paused = true;
      clearTimeout(resumeTimeout);
    }
    function resumeSoon() {
      clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => { paused = false; }, 2500);
    }

    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerup", resumeSoon);
    el.addEventListener("pointercancel", resumeSoon);
    el.addEventListener("wheel", pause, { passive: true });
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resumeSoon);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resumeTimeout);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointerup", resumeSoon);
      el.removeEventListener("pointercancel", resumeSoon);
      el.removeEventListener("wheel", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resumeSoon);
    };
  }, [speed]);

  return ref;
}
