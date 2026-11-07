"use client";

import { useEffect, type RefObject } from "react";

/** Calls onDismiss on a pointer press outside `root` or on Escape, while `open`. */
export function useDismiss(open: boolean, root: RefObject<HTMLElement | null>, onDismiss: () => void) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, root, onDismiss]);
}
