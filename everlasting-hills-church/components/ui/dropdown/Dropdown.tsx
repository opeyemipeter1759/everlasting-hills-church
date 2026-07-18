"use client";

import type React from "react";
import { useEffect, useRef } from "react";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
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
    <div
      ref={dropdownRef}
      role="menu"
      className={[
        "absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl p-1.5",
        "border border-[#E7CDD3]/70 bg-white shadow-lg shadow-black/[0.06]",
        "dark:border-white/[0.09] dark:bg-[#1c1c1e] dark:shadow-black/40",
        align === "right" ? "right-0" : "left-0",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
};
