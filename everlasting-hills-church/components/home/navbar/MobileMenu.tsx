"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ATTENDANCE_HREF, isLinkActive, isPathActive, type NavLink } from "./nav-links";

// Client-side nav — a raw <a> would force a full page reload, which
// unmounts the sermon player (and its <audio> element) on every tap.
const MotionLink = motion(Link);

const outlineBtn =
  "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#87102C] text-[#87102C] text-sm font-semibold hover:bg-[#87102C]/5 transition-colors";
const solidBtn =
  "flex-1 flex items-center justify-center px-5 py-3 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors";

interface Props {
  links: NavLink[];
  pathname: string | null;
  isLoggedIn: boolean;
  onNavigate: () => void;
}

/** The slide-down menu under the bar on phones and tablets: links, dropdowns as accordions, and account buttons. */
export default function MobileMenu({ links, pathname, isLoggedIn, onNavigate }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="fixed top-16 md:top-20 inset-x-0 z-40 bg-white border-b border-brand-rose shadow-xl lg:hidden max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-5rem)] overflow-y-auto"
    >
      <nav className="flex flex-col py-4 px-4 xs:px-5">
        {links.map((link, i) =>
          link.children ? (
            <div key={link.id} className="border-b border-brand-rose/50 last:border-0">
              <button
                type="button"
                onClick={() => setOpenId((o) => (o === link.id ? null : link.id))}
                aria-expanded={openId === link.id}
                className={`flex w-full items-center justify-between py-3.5 text-[15px] font-medium hover:text-burgundy transition-colors ${
                  isLinkActive(pathname, link) ? "text-burgundy" : "text-[#222]"
                }`}
              >
                {link.label}
                <ChevronDown size={16} className={`transition-transform duration-200 ${openId === link.id ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {openId === link.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-2">
                      {link.children.map((child) => {
                        const Icon = child.icon;
                        const childActive = isPathActive(pathname, child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-lg py-2.5 pl-2 text-[14px] font-medium transition-colors hover:text-burgundy ${
                              childActive ? "text-burgundy bg-brand-blush" : "text-[#555]"
                            }`}
                          >
                            {Icon && <Icon size={16} className="shrink-0 text-burgundy/70" />}
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <MotionLink
              key={link.id}
              href={link.href!}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={onNavigate}
              className={`py-3.5 text-[15px] font-medium border-b border-brand-rose/50 last:border-0 hover:text-burgundy transition-colors ${
                isLinkActive(pathname, link) ? "text-burgundy" : "text-[#222]"
              }`}
            >
              {link.label}
            </MotionLink>
          ),
        )}
        <div className="mt-4 flex gap-3">
          {isLoggedIn ? (
            <>
              <Link href={ATTENDANCE_HREF} onClick={onNavigate} className={outlineBtn}>
                <CalendarCheck size={16} />
                Attendance
              </Link>
              <Link href="/dashboard" onClick={onNavigate} className={solidBtn}>
                My Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" onClick={onNavigate} className={outlineBtn}>
                Login
              </Link>
              <Link href="/#services" onClick={onNavigate} className={solidBtn}>
                Join Us Sunday
              </Link>
            </>
          )}
        </div>
      </nav>
    </motion.div>
  );
}
