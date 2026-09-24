"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useAnchoredPosition } from "../useAnchoredPosition";
import { SelectTrigger } from "./SelectTrigger";
import { SelectListbox } from "./SelectListbox";
import { useSelectKeys } from "./useSelectKeys";
import { useSelectPopover } from "./useSelectPopover";
import type { SelectProps } from "./types";

/**
 * The one dropdown the app uses, a drop-in for a native <select>.
 *
 * Why a custom control: the native popup is drawn by the operating system —
 * white, un-themable, differently shaped on every machine — so it never looks
 * like the rest of the page. This renders its own listbox in the church's
 * colours while keeping the parts people expect of a select: keyboard control,
 * type-ahead, a tick beside what is chosen, and optional group headings.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  id,
  name,
  icon,
  prefixLabel,
  className = "",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const selectable = useMemo(() => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0), [options]);

  // The portal target only exists after mount, so SSR renders the trigger alone.
  useEffect(() => setMounted(true), []);
  const { rect, openUp } = useAnchoredPosition(triggerRef, open, 260);

  useSelectPopover({ open, setOpen, options, value, highlight, setHighlight, selectable, triggerRef, listRef });

  function commit(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  const onKeyDown = useSelectKeys({ options, selectable, open, disabled, highlight, setOpen, setHighlight, commit });

  return (
    <>
      <SelectTrigger
        ref={triggerRef}
        id={id}
        label={selected?.label ?? null}
        swatch={selected?.swatch}
        placeholder={placeholder}
        prefixLabel={prefixLabel}
        icon={icon}
        open={open}
        disabled={disabled}
        listboxId={listboxId}
        className={className}
        ariaLabel={ariaLabel}
        ariaLabelledby={ariaLabelledby}
        onToggle={() => setOpen(!open)}
        onKeyDown={onKeyDown}
      />

      {/* Hidden field so this still posts if it sits inside a plain <form>. */}
      {name && <input type="hidden" name={name} value={value} />}

      {mounted && open && rect && (
        <SelectListbox
          listboxId={listboxId}
          listRef={listRef}
          rect={rect}
          openUp={openUp}
          options={options}
          value={value}
          highlight={highlight}
          onHighlight={setHighlight}
          onCommit={commit}
        />
      )}
    </>
  );
}
