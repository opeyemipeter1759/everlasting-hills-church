"use client";

import type React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface DropdownItemProps {
  tag?: "a" | "button";
  href?: string;
  onClick?: () => void;
  /** Runs alongside onClick — by convention the caller closes the menu here. */
  onItemClick?: () => void;
  /** Leading icon. Sized and coloured by the item so menus stay visually aligned. */
  icon?: LucideIcon;
  /** Destructive action (delete, sign out) — renders red. */
  danger?: boolean;
  /** Escape hatch: replaces the item's own layout/colour classes entirely. */
  baseClassName?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * One row in a Dropdown. Renders a link when given `tag="a"` + `href`, a button
 * otherwise, so navigation items stay real anchors (middle-click, open in new tab)
 * rather than buttons that call router.push.
 */
export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  href,
  onClick,
  onItemClick,
  icon: Icon,
  danger = false,
  baseClassName,
  className = "",
  children,
}) => {
  const base =
    baseClassName ??
    [
      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40",
      danger
        ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        : "text-[#111] hover:bg-[#FFF4F6] dark:text-white/80 dark:hover:bg-white/[0.06] dark:hover:text-white",
    ].join(" ");

  const combinedClasses = `${base} ${className}`.trim();

  const handleClick = (event: React.MouseEvent) => {
    // Links must keep navigating; only buttons swallow the event.
    if (tag === "button") event.preventDefault();
    if (onClick) onClick();
    if (onItemClick) onItemClick();
  };

  const content = (
    <>
      {Icon && (
        <Icon
          size={15}
          aria-hidden="true"
          className={[
            "flex-shrink-0",
            danger ? "text-red-500 dark:text-red-400" : "text-[#8a7e80] dark:text-white/40",
          ].join(" ")}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </>
  );

  if (tag === "a" && href) {
    return (
      <Link href={href} role="menuitem" className={combinedClasses} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" onClick={handleClick} className={combinedClasses}>
      {content}
    </button>
  );
};
