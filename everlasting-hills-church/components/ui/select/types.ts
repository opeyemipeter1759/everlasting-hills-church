import type { ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** A heading this option sits under, the way a native <optgroup> works. */
  group?: string;
  /** A small colour dot before the label — for statuses and other coded values. */
  swatch?: string;
  /** Muted text at the right of the row, e.g. a count. */
  hint?: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown (muted) when `value` matches no option, i.e. the empty/"Any" state. */
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  /** A small icon inside the trigger, before the value. */
  icon?: ReactNode;
  /** A muted word before the value, so a filter reads "Status: Integrated". */
  prefixLabel?: string;
  /** Applied to the trigger button — pass the same box classes the old <select> used. */
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}
