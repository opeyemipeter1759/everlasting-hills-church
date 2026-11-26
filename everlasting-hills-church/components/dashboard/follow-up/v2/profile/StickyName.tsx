"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The person's name, pinned just under the top bar while their profile scrolls.
 * At rest it reads as the page title. Once pinned it becomes a solid bar with a
 * rule and shadow below it, so the details scroll cleanly underneath instead of
 * showing through.
 */
export function StickyName({ name }: { name: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const check = () => {
      const el = ref.current;
      if (!el) return;
      const top = parseFloat(getComputedStyle(el).top) || 0;
      setStuck(el.getBoundingClientRect().top <= top + 0.5 && window.scrollY > 0);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <h1
      ref={ref}
      data-stuck={stuck || undefined}
      className={`sticky top-[var(--app-header-h,4.5rem)] z-20 -mx-4 truncate px-4 font-bold text-[#111] transition-all duration-200 dark:text-white sm:-mx-5 sm:px-5 text-xl ${
        stuck
          ? "border-b border-gray-200 bg-white py-3 shadow-[0_6px_16px_-10px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-gray-950"
          : "border-b border-transparent bg-gray-50 py-1 dark:bg-gray-950"
      }`}
    >
      {name}
    </h1>
  );
}
