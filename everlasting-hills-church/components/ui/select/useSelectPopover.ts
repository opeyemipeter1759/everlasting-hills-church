"use client";

import { useEffect, type RefObject } from "react";
import type { SelectOption } from "./types";

/** The open panel's housekeeping: dismissing it, and where the highlight sits. */
export function useSelectPopover(args: {
  open: boolean;
  setOpen: (open: boolean) => void;
  options: SelectOption[];
  value: string;
  highlight: number;
  setHighlight: (index: number) => void;
  selectable: number[];
  triggerRef: RefObject<HTMLButtonElement | null>;
  listRef: RefObject<HTMLUListElement | null>;
}) {
  const { open, setOpen, options, value, highlight, setHighlight, selectable, triggerRef, listRef } = args;

  // Dismiss on a pointer-down anywhere but the trigger and the panel.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opening lands on what is already chosen, else the first thing choosable.
  useEffect(() => {
    if (!open) return;
    const current = options.findIndex((o) => o.value === value && !o.disabled);
    setHighlight(current >= 0 ? current : (selectable[0] ?? -1));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!open || highlight < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]); // eslint-disable-line react-hooks/exhaustive-deps
}
