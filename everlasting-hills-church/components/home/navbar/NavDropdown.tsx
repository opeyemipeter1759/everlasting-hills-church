"use client";

import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import NavDropdownPanel from "./NavDropdownPanel";
import { isLinkActive, type NavLink } from "./nav-links";

interface Props {
  link: NavLink;
  /** "link" = text trigger in the nav row; "button" = the filled Give button. */
  variant: "link" | "button";
  isOpen: boolean;
  /** Bar is on a light background (scrolled or a light page). */
  solid: boolean;
  pathname: string | null;
  containerRef: (el: HTMLDivElement | null) => void;
  onPointerEnter: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onToggle: () => void;
  onClose: () => void;
}

/** A desktop dropdown: trigger (opens on hover or click) plus its panel. */
export default function NavDropdown({
  link,
  variant,
  isOpen,
  solid,
  pathname,
  containerRef,
  onPointerEnter,
  onPointerLeave,
  onToggle,
  onClose,
}: Props) {
  const active = isLinkActive(pathname, link);
  const triggerClass =
    variant === "button"
      ? "flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:shadow-burgundy/20"
      : `relative flex items-center gap-1 py-2 text-[14px] font-medium transition-colors duration-200 hover:text-burgundy whitespace-nowrap ${
          active ? (solid ? "text-burgundy" : "text-white") : solid ? "text-[#333]" : "text-white/85"
        }`;

  return (
    <div ref={containerRef} className="relative" onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <button type="button" onClick={onToggle} aria-haspopup="menu" aria-expanded={isOpen} className={triggerClass}>
        {link.label}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        {variant === "link" && active && (
          <span aria-hidden className={`absolute -bottom-0.5 left-0 right-5 h-0.5 rounded-full ${solid ? "bg-burgundy" : "bg-white"}`} />
        )}
      </button>
      <AnimatePresence>
        {isOpen && <NavDropdownPanel link={link} variant={variant} pathname={pathname} onNavigate={onClose} />}
      </AnimatePresence>
    </div>
  );
}
