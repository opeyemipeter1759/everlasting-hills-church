"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

export interface KebabItem {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  icon?: LucideIcon;
}

/**
 * Kebab (⋮) menu built on the house Dropdown, so panel chrome, theming and dismissal
 * (Escape / outside click / item select) all come from the shared standard.
 */
export default function KebabMenu({
  items,
  label = "Card options",
}: {
  items: KebabItem[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="dropdown-toggle flex h-8 w-8 items-center justify-center rounded-lg text-[#b8a8ac] transition-colors hover:bg-[#FFF4F6] hover:text-[#87102C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/40 dark:text-white/30 dark:hover:bg-white/[0.06] dark:hover:text-white"
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>

      <Dropdown isOpen={open} onClose={close} className="w-44">
        {items.map((it) => (
          <DropdownItem
            key={it.label}
            tag={it.href ? "a" : "button"}
            href={it.href}
            icon={it.icon}
            danger={it.danger}
            onClick={it.onClick}
            onItemClick={close}
          >
            {it.label}
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  );
}
