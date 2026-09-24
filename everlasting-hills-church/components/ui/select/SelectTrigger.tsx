"use client";

import { forwardRef, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** The closed control: what is chosen, and the chevron that says there is more. */
export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  {
    label: string | null;
    swatch?: string;
    placeholder: string;
    prefixLabel?: string;
    icon?: ReactNode;
    open: boolean;
    disabled: boolean;
    id?: string;
    listboxId: string;
    className: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    onToggle: () => void;
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  }
>(function SelectTrigger(props, ref) {
  const { label, swatch, placeholder, prefixLabel, icon, open, disabled, className } = props;
  return (
    <button
      type="button"
      ref={ref}
      id={props.id}
      disabled={disabled}
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? props.listboxId : undefined}
      aria-label={props.ariaLabel}
      aria-labelledby={props.ariaLabelledby}
      onClick={() => !disabled && props.onToggle()}
      onKeyDown={props.onKeyDown}
      className={[
        "flex items-center gap-2 text-left",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        open ? "border-[#87102C]/40 ring-2 ring-[#87102C]/10" : "",
        className,
      ].join(" ")}
    >
      {icon && <span className="flex-shrink-0 text-[#8a7e80] dark:text-white/40">{icon}</span>}
      {swatch && <span aria-hidden="true" className={`h-2 w-2 flex-shrink-0 rounded-full ${swatch}`} />}
      {prefixLabel && (
        <span className="flex-shrink-0 text-[#8a7e80] dark:text-white/40">{prefixLabel}</span>
      )}
      <span className={["min-w-0 flex-1 truncate", label ? "" : "text-[#8a7e80] dark:text-white/40"].join(" ")}>
        {label ?? placeholder}
      </span>
      <ChevronDown
        size={16}
        aria-hidden="true"
        className={[
          "flex-shrink-0 text-[#8a7e80] transition-transform duration-150 dark:text-white/40",
          open ? "rotate-180" : "",
        ].join(" ")}
      />
    </button>
  );
});
