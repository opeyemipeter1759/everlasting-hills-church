"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { HeaderProvider } from "@/layout/Head";
import AppSidebar from "@/layout/AppSidebar";
import AppHeader from "@/layout/AppHeader";

/**
 * Shell for /admin/* — reuses the same sidebar + header chrome as the dashboard so the
 * Super Admin area is visually consistent. Theme + sidebar context come from the parent
 * (dashboard) group layout. Kept separate so we don't modify the existing dashboard
 * layout, per "no unrelated changes".
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  const sidebarWidth = isExpanded || isHovered ? "lg:ml-[250px]" : "lg:ml-[72px]";

  return (
    <HeaderProvider>
      <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-950">
        <AppSidebar />

        {isMobileOpen && (
          <div
            className="fixed inset-x-0 bottom-0 top-[90px] z-40 bg-black/50 lg:hidden"
            aria-hidden="true"
            onClick={toggleMobileSidebar}
          />
        )}

        <div className={`flex min-h-screen flex-col transition-all duration-300 ease-in-out ${sidebarWidth}`}>
          <AppHeader />
          <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-4">
            <div className="mx-auto max-w-screen-2xl">{children}</div>
          </main>
        </div>
      </div>
    </HeaderProvider>
  );
}
