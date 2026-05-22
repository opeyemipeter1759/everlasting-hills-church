"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ehc-theme");
    // Trust localStorage first; fall back to whatever FOUC script set
    const dark = saved === "dark" || (!saved && document.documentElement.classList.contains("dark"));
    setIsDark(dark);
    // Ensure html class is in sync with saved preference
    document.documentElement.classList[dark ? "add" : "remove"]("dark");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList[next ? "add" : "remove"]("dark");
    localStorage.setItem("ehc-theme", next ? "dark" : "light");
  };

  // Render a same-size invisible placeholder until client is ready
  // to avoid layout shift and hydration mismatch
  if (!mounted) {
    return <div className="w-9 h-9 flex-shrink-0" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={
        className ??
        "w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 transition-colors"
      }
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
