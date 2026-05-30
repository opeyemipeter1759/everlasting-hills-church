'use client';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';
import { Menu, Sun, Moon, X, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React, { useMemo } from 'react';
import SessionActionMenu from '@/components/auth/SessionActionMenu';

function usePageTitle() {
  const pathname = usePathname();
  return useMemo(() => {
    if (!pathname) return 'Dashboard';
    const segments = pathname.replace('/dashboard', '').split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    return segments[segments.length - 1]
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [pathname]);
}

/* short weekday + date string */
function useTodayLabel() {
  return useMemo(() => {
    return new Date().toLocaleDateString('en-NG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);
}

const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const pageTitle = usePageTitle();
  const today = useTodayLabel();

  const handleMenuToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex  py-2 w-full shrink-0 items-center gap-4
      border-b border-gray-200/80 justify-between  backdrop-blur-sm px-2
      dark:border-gray-800 dark:bg-gray-900/95
      shadow-[0_1px_3px_rgba(0,0,0,0.04)]
      transition-colors duration-300 lg:px-6">

      {/* ── Left ── */}
      <div className="flex items-center gap-3 mr-auto min-w-0">
        <button
          type="button"
          onClick={handleMenuToggle}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
            text-gray-400 hover:bg-gray-100 hover:text-gray-700
            dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200
            transition-colors duration-150"
            aria-label={isMobileOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isMobileOpen ? <X size={19} strokeWidth={2} /> : <Menu size={19} strokeWidth={2} />}
        </button>

        {/* page title + date */}
        <div className="hidden sm:flex flex-col min-w-0 leading-none">
          <h1 className="truncate text-[15px] font-bold font-jakarta text-gray-900 dark:text-white tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-[11px] font-medium font-jakarta text-gray-400 dark:text-gray-500 mt-0.5 tracking-wide">
            {today}
          </p>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex shrink-0 items-center gap-1 mr-20">

        {/* dark-mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg
            text-gray-400 hover:bg-gray-100 hover:text-gray-700
            dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-yellow-400
            transition-colors duration-150"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun size={18} strokeWidth={1.9} />
            : <Moon size={18} strokeWidth={1.9} />}
        </button>

        {/* notification bell */}
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg
            text-gray-400 hover:bg-gray-100 hover:text-gray-700
            dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200
            transition-colors duration-150"
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.9} />
          {/* unread dot */}
        </button>

        {/* divider */}

        <SessionActionMenu
          loggedOutMode="login-only"
          triggerClassName="inline-flex items-center gap-2  px-3 py-2   "
          menuClassName="w-[200px]"
        />
      </div>
    </header>
  );
};

export default AppHeader;
