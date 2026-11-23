"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import NavUserBadge, { useIsLoggedIn } from "./NavUserBadge";
import NavDropdown from "./navbar/NavDropdown";
import MobileMenu from "./navbar/MobileMenu";
import { giveLink, isLinkActive, LIGHT_PAGES, navLinks, type NavLink } from "./navbar/nav-links";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set when a dropdown opens on mouse hover, so the follow-up click doesn't immediately close it.
  const openedByHover = useRef(false);
  const isLoggedIn = useIsLoggedIn(); // null on first paint (hydration-safe), then true/false
  const pathname = usePathname();
  const darkHero = !LIGHT_PAGES.some((path) => pathname === path || pathname?.startsWith(`${path}/`));
  const solid = scrolled || !darkHero;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Matches the `lg` breakpoint where the desktop nav takes over from the hamburger.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close the open dropdown on an outside click, Escape, or navigation.
  useEffect(() => {
    if (!openDropdown) return;
    const activeDropdown = openDropdown;
    function onPointerDown(e: PointerEvent) {
      const el = dropdownRefs.current[activeDropdown];
      if (el && !el.contains(e.target as Node)) setOpenDropdown(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenDropdown(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openDropdown]);

  useEffect(() => {
    setOpenDropdown(null);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function hoverOpen(id: string, e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    cancelClose();
    if (openDropdown !== id) openedByHover.current = true;
    setOpenDropdown(id);
  }

  function hoverClose(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 150);
  }

  function clickToggle(id: string) {
    cancelClose();
    if (openDropdown === id && openedByHover.current) {
      // The hover already opened it; treat this click as "keep it open".
      openedByHover.current = false;
      return;
    }
    openedByHover.current = false;
    setOpenDropdown((o) => (o === id ? null : id));
  }

  const dropdown = (link: NavLink, variant: "link" | "button") => (
    <NavDropdown
      key={link.id}
      link={link}
      variant={variant}
      isOpen={openDropdown === link.id}
      solid={solid}
      pathname={pathname}
      containerRef={(el) => {
        dropdownRefs.current[link.id] = el;
      }}
      onPointerEnter={(e) => hoverOpen(link.id, e)}
      onPointerLeave={hoverClose}
      onToggle={() => clickToggle(link.id)}
      onClose={() => setOpenDropdown(null)}
    />
  );

  const textTone = (active: boolean) =>
    active ? (solid ? "text-burgundy" : "text-white") : solid ? "text-[#333]" : "text-white/85";

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          solid ? "bg-white/95 backdrop-blur-sm shadow-[0_1px_20px_rgba(135,16,44,0.08)]" : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 xs:px-5 sm:px-8">
          <div className="flex items-center justify-between gap-2 h-16 md:h-20">
            {/* Logo — the mark and wordmark both step down under 400px so the
                hamburger and the signed-in avatar still fit on a 320px phone. */}
            <Link href="/" className="flex min-w-0 items-center gap-2 xs:gap-2.5 group">
              {solid ? (
                <Image src="/logoblack.png" alt="Everlasting Hills Church Logo" width={62} height={62} className="h-11 w-11 xs:h-[62px] xs:w-[62px] flex-shrink-0" />
              ) : (
                <Image src="/logo.png" alt="Everlasting Hills Church Logo" width={52} height={52} className="h-10 w-10 xs:h-[52px] xs:w-[52px] flex-shrink-0" />
              )}
              <div className="flex min-w-0 flex-col leading-none">
                <span className={`truncate text-sm xs:text-base font-bold tracking-wide transition-colors duration-300 ${solid ? "text-[#111111]" : "text-white"}`}>
                  Everlasting Hills
                </span>
                <span
                  className={`text-xs xs:text-sm tracking-[0.15em] uppercase font-medium transition-colors duration-300 ${
                    solid ? "text-burgundy font-semibold" : "text-white/70"
                  }`}
                >
                  Church
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => {
                if (link.children) return dropdown(link, "link");
                const active = isLinkActive(pathname, link);
                return (
                  <Link
                    key={link.id}
                    href={link.href!}
                    className={`relative py-2 text-[14px] font-medium transition-colors duration-200 hover:text-burgundy whitespace-nowrap ${textTone(active)}`}
                  >
                    {link.label}
                    {active && (
                      <span aria-hidden className={`absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full ${solid ? "bg-burgundy" : "bg-white"}`} />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2 xs:gap-3">
              <div className="hidden lg:block">{dropdown(giveLink, "button")}</div>
              {/* Authenticated → avatar + dropdown. Anonymous → Login + Join CTAs. */}
              {isLoggedIn === true ? (
                <NavUserBadge scrolled={solid} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`hidden lg:inline-flex px-5 py-2.5 rounded-xl border hover:bg-[#87102C] items-center text-sm font-medium transition-colors duration-200 hover:text-white hover:border-[#87102C] ${
                      solid ? "text-[#333] border-[#E7CDD3]" : "text-white/80 border-white/20"
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/#services"
                    className={`hidden xl:inline-flex items-center px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                      solid ? "border-[#87102C] text-[#87102C] hover:bg-[#87102C]/5" : "border-white text-white hover:bg-white/10"
                    }`}
                  >
                    Join Us Sunday
                  </Link>
                </>
              )}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`lg:hidden shrink-0 p-1.5 xs:p-2 rounded-lg transition-colors ${
                  solid ? "text-[#111] hover:bg-brand-blush" : "text-white hover:bg-white/10"
                }`}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <MobileMenu
            links={[...navLinks, giveLink]}
            pathname={pathname}
            isLoggedIn={isLoggedIn === true}
            onNavigate={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
