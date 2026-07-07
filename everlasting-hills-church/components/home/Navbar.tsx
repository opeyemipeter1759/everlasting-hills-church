"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import NavUserBadge, { useIsLoggedIn } from "./NavUserBadge";

// Client-side nav for the mobile menu — a raw <a> would force a full page reload, which
// unmounts the sermon player (and its <audio> element) on every tap.
const MotionLink = motion(Link);

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Beliefs", href: "/beliefs" },
  // Real link to the public sermon library, not just the homepage section anchor.
  { label: "Sermons", href: "/sermons" },
  { label: "Events", href: "/events" },
  { label: "Ministries", href: "/ministries" },
  { label: "Visit", href: "/visit" },
  { label: "Connect", href: "/connect" },
  { label: "Give", href: "/give" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = useIsLoggedIn(); // null on first paint (hydration-safe), then true/false
  const pathname = usePathname();
  // Only the home page has a dark hero — every other public page has a light background.
  const darkHero = pathname != "/ewlnwjenk";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !darkHero
            ? "bg-white/95 backdrop-blur-sm shadow-[0_1px_20px_rgba(135,16,44,0.08)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px]  mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
            {scrolled || !darkHero ? (
              <Image src="/logoblack.png" alt="Everlasting Hills Church Logo" width={62} height={62} className="flex-shrink-0" />
            ) : (
              <Image src="/logo.png" alt="Everlasting Hills Church Logo" width={52} height={52} className="flex-shrink-0" />
            )}
              <div className="flex flex-col leading-none">
                <span
                  className={`font-bold  tracking-wide transition-colors duration-300 ${
                    scrolled || !darkHero ? "text-[#111111]" : "text-white"
                  }`}
                >
                  Everlasting Hills
                </span>
                <span
                  className={`text-sm tracking-[0.15em] uppercase font-medium transition-colors duration-300 ${
                    scrolled || !darkHero ? "text-burgundy font-semibold" : "text-white/70"
                  }`}
                >
                  Church
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-burgundy ${
                    scrolled || !darkHero ? "text-[#333]" : "text-white/90"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              {/* Authenticated → avatar + dropdown. Anonymous → Login + Join CTAs. */}
              {isLoggedIn === true ? (
                <NavUserBadge scrolled={scrolled} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`hidden lg:inline-flex px-5 py-2.5 rounded-xl border hover:bg-[#87102C] items-center text-sm font-medium transition-colors duration-200 hover:text-white hover:border-none ${
                      scrolled || !darkHero ? "text-[#333] border-[#E7CDD3]" : "text-white/80 border-white/20"
                    }`}
                  >
                    Login
                  </Link>
                  <a
                    href="#services"
                    className="hidden lg:inline-flex items-center px-5 py-2.5 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:shadow-burgundy/20 hover:-translate-y-0.5"
                  >
                    Join Us Sunday
                  </a>
                </>
              )}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  scrolled || !darkHero
                    ? "text-[#111] hover:bg-brand-blush"
                    : "text-white hover:bg-white/10"
                }`}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-0 z-40 bg-white border-b border-brand-rose shadow-xl lg:hidden"
          >
            <nav className="flex flex-col py-4 px-5">
              {navLinks.map((link, i) => (
                <MotionLink
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setMenuOpen(false)}
                  className="py-3.5 text-[15px] font-medium text-[#222] border-b border-brand-rose/50 last:border-0 hover:text-burgundy transition-colors"
                >
                  {link.label}
                </MotionLink>
              ))}
              <div className="flex gap-3 mt-4">
                {isLoggedIn === true ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 flex items-center justify-center px-5 py-3 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
                  >
                    My Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 flex items-center justify-center px-5 py-3 rounded-xl border border-[#87102C] text-[#87102C] text-sm font-semibold hover:bg-[#87102C]/5 transition-colors"
                    >
                      Login
                    </Link>
                    <a
                      href="#services"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 flex items-center justify-center px-5 py-3 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
                    >
                      Join Us Sunday
                    </a>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MountainLogo({ scrolled }: { scrolled: boolean }) {
  const fill = scrolled ? "#87102C" : "white";
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Outer mountain */}
      <path d="M4 32L20 8L36 32H4Z" fill={fill} opacity="0.15" />
      {/* Inner peak */}
      <path d="M11 32L20 14L29 32H11Z" fill={fill} opacity="0.4" />
      {/* Summit */}
      <path d="M16 32L20 20L24 32H16Z" fill={fill} />
    </svg>
  );
}
