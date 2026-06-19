"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const clearTrickle = () => {
    if (trickle.current !== null) {
      window.clearInterval(trickle.current);
      trickle.current = null;
    }
  };

  const start = useCallback(() => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    clearTrickle();
    setVisible(true);
    setProgress(12);
    trickle.current = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.18));
    }, 200);
  }, []);

  useEffect(() => {
    clearTrickle();
    setProgress((p) => (p === 0 ? 0 : 100));
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
    return () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    function shouldTrack(e: MouseEvent): boolean {
      if (e.defaultPrevented || e.button !== 0) return false;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return false;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return false;
      if (anchor.hasAttribute("download")) return false;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return false;
      }
      if (url.origin !== window.location.origin) return false;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
      return true;
    }
    function onClick(e: MouseEvent) {
      if (shouldTrack(e)) start();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]" style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}>
      <div className="h-full bg-gradient-to-r from-[#87102C] via-[#c93860] to-[#FFB3C1]" style={{ width: `${progress}%`, transition: "width 200ms ease", boxShadow: "0 0 10px rgba(135,16,44,0.5)" }} />
    </div>
  );
}
