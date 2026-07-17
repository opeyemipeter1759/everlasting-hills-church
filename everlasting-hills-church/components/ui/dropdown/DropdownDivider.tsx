import type React from "react";

/** Hairline separating groups of items, e.g. actions above, "Sign out" below. */
export const DropdownDivider: React.FC = () => (
  <div role="separator" className="my-1 h-px bg-[#E7CDD3]/70 dark:bg-white/[0.08]" />
);
