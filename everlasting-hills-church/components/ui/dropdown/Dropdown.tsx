"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredPosition } from "../useAnchoredPosition";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Which edge the panel hangs from. Defaults to the right, as most triggers sit inline-end. */
  align?: "left" | "right";
  /** Extra classes — width, max-height, offsets. Panel chrome comes from the base. */
  className?: string;
}

/**
 * The house dropdown panel.
 *
 * Width is left to the caller (a kebab menu and a notification feed want very
 * different panels), but chrome, elevation, theming and dismissal are fixed here so
 * every menu in the app looks and behaves the same.
 *
 * The panel is portalled to <body> with fixed positioning — so it's never clipped
 * by an ancestor's overflow (kebab menus live inside scrollable tables and cards) —
 * and tracks its trigger via a zero-size anchor rendered in the trigger's original
 * position (this component is always mounted as a sibling of its trigger inside a
 * `position: relative` wrapper, so the anchor's rect equals the trigger's rect).
 * Position recomputes on open and on any scroll/resize, page-level or ancestor, so
 * the panel never detaches from its trigger while scrolling — see useAnchoredPosition.
 *
 * Dismissal: outside click, Escape, or the caller closing on item select. The trigger
 * must carry `.dropdown-toggle` so clicking it doesn't close-then-reopen — the outside
 * handler ignores that element and lets the trigger's own onClick do the toggling.
 */
export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  align = "right",
  className = "",
}) => {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { rect, openUp } = useAnchoredPosition(anchorRef, isOpen, 200);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Zero-size marker sitting exactly where the panel used to render in-flow —
          gives us a rect to anchor the portalled panel to without requiring every
          caller to pass a trigger ref. */}
      <span ref={anchorRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />

      {mounted &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{
              position: "fixed",
              ...(openUp ? { bottom: window.innerHeight - rect.triggerTop + 4 } : { top: rect.triggerBottom + 4 }),
              ...(align === "right" ? { right: window.innerWidth - (rect.left + rect.width) } : { left: rect.left }),
            }}
            className={[
              "z-[60] min-w-[12rem] overflow-hidden rounded-xl p-1.5",
              "border border-[#E7CDD3]/70 bg-white shadow-lg shadow-black/[0.06]",
              "dark:border-white/[0.09] dark:bg-[#1c1c1e] dark:shadow-black/40",
              className,
            ].join(" ")}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
};
