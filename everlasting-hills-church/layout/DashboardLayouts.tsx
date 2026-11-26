'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import AppSidebar from '@/layout/AppSidebar';
import AppHeader from '@/layout/AppHeader';

export default function DashboardLayouts({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Publishes the top bar's height as --app-header-h, so a page can pin its own header just under it.
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const set = () => document.documentElement.style.setProperty('--app-header-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  const sidebarWidth = isExpanded || isHovered ? 'lg:ml-[240px]' : 'lg:ml-[65px]';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <AppSidebar />
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={toggleMobileSidebar}
        />
      )}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarWidth}`}>
        <div ref={headerRef} className="sticky top-0 z-50">
          <AppHeader />
        </div>
        {/* overflow-x-clip, not hidden: it trims sideways spill without making <main> a scroll box, so sticky headers in a page stick to the window. */}
        <main ref={mainRef} className="flex-1 overflow-x-clip p-4 md:p-6 xl:px-8 2xl:px-10">
          {/* Capped so a very wide screen keeps breathing room left and right instead of stretching edge to edge. */}
          <div className="mx-auto w-full max-w-[1680px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
