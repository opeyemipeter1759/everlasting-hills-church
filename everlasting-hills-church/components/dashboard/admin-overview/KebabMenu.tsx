"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";

export interface KebabItem {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}

/**
 * Accessible kebab (⋮) menu. Closes on Escape, outside click, or item select.
 * Items can be navigation links (href) or actions (onClick).
 */
export default function KebabMenu({
  items,
  label = "Card options",
}: {
  items: KebabItem[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#b8a8ac] transition-colors hover:bg-[#FFF4F6] hover:text-[#87102C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:text-white/30 dark:hover:bg-white/[0.06] dark:hover:text-white"
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-xl border border-[#E7CDD3]/70 bg-white py-1 shadow-xl dark:border-white/[0.1] dark:bg-[#1c1c1e]"
        >
          {items.map((it) => {
            const cls = `block w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
              it.danger
                ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                : "text-[#444] hover:bg-[#FFF4F6] dark:text-white/70 dark:hover:bg-white/[0.05]"
            }`;
            return it.href ? (
              <Link
                key={it.label}
                href={it.href}
                role="menuitem"
                className={cls}
                onClick={() => setOpen(false)}
              >
                {it.label}
              </Link>
            ) : (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                className={cls}
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
