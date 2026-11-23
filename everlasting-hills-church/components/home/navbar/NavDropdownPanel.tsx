"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { isPathActive, MEGA_THRESHOLD, type NavLink } from "./nav-links";

interface Props {
  link: NavLink;
  variant: "link" | "button";
  pathname: string | null;
  onNavigate: () => void;
}

/** The floating panel under a desktop dropdown trigger: items with icon + description, optional footer CTA. */
export default function NavDropdownPanel({ link, variant, pathname, onNavigate }: Props) {
  const children = link.children ?? [];
  const mega = children.length > MEGA_THRESHOLD;

  return (
    // Outer wrapper only positions; pt-3 (not mt-3) keeps the gap under the trigger
    // inside the hover area so the pointer can travel into the panel.
    <div className={`absolute top-full z-50 pt-3 ${variant === "button" ? "right-0" : mega ? "left-1/2 -translate-x-1/2" : "-left-4"}`}>
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: variant === "button" ? "top right" : mega ? "top center" : "top left" }}
        className="relative"
      >
        <div
          role="menu"
          className={`overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-8px_rgba(16,24,40,0.14),0_24px_56px_-16px_rgba(135,16,44,0.12)] ${
            mega ? "w-[600px]" : variant === "button" ? "w-[280px]" : "w-[300px]"
          }`}
        >
          <div className={`p-2 ${mega ? "grid grid-cols-2 gap-x-1 gap-y-0.5" : "flex flex-col gap-0.5"}`}>
            {children.map((child) => {
              const Icon = child.icon;
              const childActive = isPathActive(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  role="menuitem"
                  aria-current={childActive ? "page" : undefined}
                  onClick={onNavigate}
                  className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 outline-none transition-colors duration-150 hover:bg-[#FAF5F6] focus-visible:bg-[#FAF5F6] focus-visible:ring-2 focus-visible:ring-burgundy/30 ${
                    childActive ? "bg-[#FAF5F6]" : ""
                  }`}
                >
                  {Icon && (
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors duration-150 ${
                        childActive
                          ? "border-burgundy/20 bg-burgundy text-white"
                          : "border-[#EEE6E8] bg-white text-[#6B5A5E] group-hover:border-burgundy/25 group-hover:text-burgundy"
                      }`}
                    >
                      <Icon size={17} strokeWidth={1.75} />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span
                      className={`block text-[13.5px] font-semibold leading-5 tracking-[-0.005em] ${
                        childActive ? "text-burgundy" : "text-[#1A1A1A] group-hover:text-burgundy"
                      }`}
                    >
                      {child.label}
                    </span>
                    {child.description && (
                      <span className="block truncate text-[12.5px] leading-[18px] text-[#7A7175]">{child.description}</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
          {link.footer && (
            <div className="flex items-center justify-between gap-4 border-t border-[#F1EAEC] bg-[#FCF9FA] px-4 py-3">
              <span className="text-[12.5px] text-[#7A7175]">{link.footer.text}</span>
              <Link
                href={link.footer.href}
                onClick={onNavigate}
                className="group/cta inline-flex items-center gap-1 text-[12.5px] font-semibold text-burgundy hover:text-[#6E0C24]"
              >
                {link.footer.label}
                <ArrowRight size={13} className="transition-transform duration-150 group-hover/cta:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>
        {/* Pointer arrow, aligned under the trigger. Drawn after the panel and nudged
            1px down so its white base covers the panel's top hairline. */}
        <span
          aria-hidden
          className={`absolute -top-[5px] z-10 h-3 w-3 rotate-45 rounded-tl-[3px] bg-white ring-1 ring-black/[0.06] [clip-path:polygon(0_0,100%_0,0_100%)] ${
            variant === "button" ? "right-8" : mega ? "left-1/2 -ml-1.5" : "left-9"
          }`}
        />
      </motion.div>
    </div>
  );
}
