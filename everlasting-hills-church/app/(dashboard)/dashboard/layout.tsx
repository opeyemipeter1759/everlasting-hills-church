'use client';
import { useSidebar } from '@/context/SidebarContext';
import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { HeaderProvider } from '@/layout/Head';
import AppSidebar from '@/layout/AppSidebar';
import AppHeader from '@/layout/AppHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [pathname]);

  const sidebarWidth = isExpanded || isHovered ? 'lg:ml-[240px]' : 'lg:ml-[72px]';

  return (
    <HeaderProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <AppSidebar />

        {isMobileOpen && (
          <div
            className="fixed top-[90px] inset-x-0 bottom-0 z-40 bg-black/50 lg:hidden"
            aria-hidden="true"
            onClick={toggleMobileSidebar}
          />
        )}

        <div
          className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarWidth}`}
        >
          <AppHeader />
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-4"
          >
            <div className="mx-auto max-w-screen-2xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </HeaderProvider>
  );
}
