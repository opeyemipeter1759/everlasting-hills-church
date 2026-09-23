"use client";

import { useRef, type KeyboardEvent } from "react";
import type { SelectOption } from "./types";

/**
 * Everything the keyboard can do to a closed or open select: arrows, Home/End,
 * Enter/Space, Escape, and type-ahead that jumps to a label as you spell it.
 * Focus never leaves the trigger, so there is no focus trap to manage.
 */
export function useSelectKeys(args: {
  options: SelectOption[];
  selectable: number[];
  open: boolean;
  disabled: boolean;
  highlight: number;
  setOpen: (open: boolean) => void;
  setHighlight: (index: number) => void;
  commit: (index: number) => void;
}) {
  const { options, selectable, open, disabled, highlight, setOpen, setHighlight, commit } = args;
  const typeahead = useRef({ buffer: "", at: 0 });

  function move(delta: number) {
    if (selectable.length === 0) return;
    const pos = selectable.indexOf(highlight);
    setHighlight(
      pos === -1
        ? selectable[delta > 0 ? 0 : selectable.length - 1]
        : selectable[(pos + delta + selectable.length) % selectable.length],
    );
  }

  function spell(char: string) {
    const now = Date.now();
    const t = typeahead.current;
    t.buffer = now - t.at > 600 ? char : t.buffer + char;
    t.at = now;
    const match = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(t.buffer.toLowerCase()));
    if (match < 0) return;
    if (open) setHighlight(match);
    else commit(match);
  }

  return function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!open) setOpen(true);
        else move(e.key === "ArrowDown" ? 1 : -1);
        break;
      case "Home":
      case "End":
        if (!open) break;
        e.preventDefault();
        setHighlight((e.key === "Home" ? selectable[0] : selectable[selectable.length - 1]) ?? -1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) setOpen(true);
        else if (highlight >= 0) commit(highlight);
        break;
      case "Escape":
        if (!open) break;
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        if (open) setOpen(false);
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) spell(e.key);
    }
  };
}
