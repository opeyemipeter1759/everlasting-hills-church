"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export interface AnchoredRect {
  /** Trigger's top edge — use for CSS `bottom` math when opening upward. */
  triggerTop: number;
  /** Trigger's bottom edge — use for CSS `top` math when opening downward. */
  triggerBottom: number;
  left: number;
  width: number;
  /** Space between the trigger's bottom edge and the viewport's bottom edge. */
  below: number;
}

/**
 * Tracks a trigger element's viewport position while a floating panel anchored
 * to it is open, so the panel (rendered with `position: fixed`, ideally via a
 * portal to <body> to escape ancestor overflow clipping) stays aligned to the
 * trigger instead of detaching when the page — or any scrollable ancestor,
 * e.g. a modal body or a table's overflow-x wrapper — scrolls.
 *
 * The `scroll` listener is registered with `capture: true`: scroll events don't
 * bubble, but a capture-phase listener on `window` still fires for scroll on
 * any descendant scrollable element, not just the page itself.
 *
 * `minSpaceBelow` is the panel's rough expected height — when there's less
 * room below the trigger than that, `openUp` flips true so the caller can
 * render the panel above the trigger instead (matching native <select> behavior).
 */
export function useAnchoredPosition(triggerRef: RefObject<HTMLElement | null>, open: boolean, minSpaceBelow = 260) {
  const [rect, setRect] = useState<AnchoredRect | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ triggerTop: r.top, triggerBottom: r.bottom, left: r.left, width: r.width, below: window.innerHeight - r.bottom });
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openUp = rect ? rect.below < minSpaceBelow : false;
  return { rect, openUp };
}
