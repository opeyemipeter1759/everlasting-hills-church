"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import SessionActionMenu from "@/components/auth/SessionActionMenu";

const navLinks = [
  { label: "About", href: "/#about" },
  { label: "Our Culture", href: "/#culture" },
  { label: "Sermons", href: "/#sermons" },
  { label: "Services", href: "/#services" },
  { label: "Community", href: "/#community" },
  { label: "Connect", href: "/connect" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          scrolled
            ? "bg-white/95 backdrop-blur-sm shadow-[0_1px_20px_rgba(135,16,44,0.08)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px]  mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group">
            {scrolled ? (
                          <Image src="/logoblack.png" alt="Everlasting Hills Church Logo" width={62} height={62} className="flex-shrink-0" />
            ) : (
              <Image src="/logo.png" alt="Everlasting Hills Church Logo" width={52} height={52} className="flex-shrink-0" />
            )}
              <div className="flex flex-col leading-none">
                <span
                  className={`font-bold  tracking-wide transition-colors duration-300 ${
                    scrolled ? "text-[#111111]" : "text-white"
                  }`}
                >
                  Everlasting Hills
                </span>
                <span
                  className={`text-sm tracking-[0.15em] uppercase font-medium transition-colors duration-300 ${
                    scrolled ? "text-burgundy font-semibold" : "text-white/70"
                  }`}
                >
                  Church
                </span>
              </div>
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-burgundy ${
                    scrolled ? "text-[#333]" : "text-white/90"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <div className="hidden lg:block">
                <SessionActionMenu
                  loggedOutMode="both"
                  joinHref="#services"
                  triggerClassName={`inline-flex h-9 items-center gap-2  px-3 py-2  ${
                    scrolled
                      ? "  text-burgundy "
                      : "  text-white"
                  }`}
                  menuClassName="w-full"
                />
              </div>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  scrolled
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
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setMenuOpen(false)}
                  className="py-3.5 text-[15px] font-medium text-[#222] border-b border-brand-rose/50 last:border-0 hover:text-burgundy transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="mt-4">
                <SessionActionMenu
                  className="w-full"
                  loggedOutMode="both"
                  joinHref="#services"
                  triggerClassName=" gap-2  flex w-full px-3 py-2.5 "
                  menuClassName="left-0 top-0 p-0 right-0 w-full"
                  onNavigate={() => setMenuOpen(false)}
                />
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
