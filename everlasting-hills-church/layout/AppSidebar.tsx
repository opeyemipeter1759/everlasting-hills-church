'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ChevronRight, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { NAV_GROUPS, ROLE_LABELS, hasMinRole } from '@/config/config';
import {
  getFrontendSessionUser,
  normalizeRole,
  SESSION_CHANGED_EVENT,
  type FrontendSessionUser,
} from '@/lib/auth/frontend-session';
 
type NavItem = {
  name: string;
  icon?: React.ReactNode;
  path: string;
  children?: NavItem[];
};


function getInitials(fullName: string | null | undefined, email: string | null | undefined) {
  const source = (fullName ?? email ?? '').trim();
  if (!source) return 'EH';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}


function buildActiveMatcher(pathname: string | null) {
  return (path: string): boolean => {
    if (!pathname) return false;
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname === path || pathname.startsWith(path + '/');
  };
}

function truncateText(s: string | null | undefined, max = 28) {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function NavIcon({ active, icon }: { active: boolean; icon: React.ReactNode }) {
  return (
    <span
      className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 ${
        active
          ? 'bg-burgundy/[0.12] text-red-600 dark:bg-burgundy/20 dark:text-red-300'
          : 'text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:bg-gray-700/60 dark:group-hover:text-gray-200'
      }`}
    >
      {icon}
    </span>
  );
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar, toggleMobileSidebar } = useSidebar();

  /**
   * Single toggle handler used by both the in-sidebar button and (mirroring) the header
   * button in AppHeader. On large screens it expands/collapses the rail; on small screens
   * it closes the slide-over drawer. Matches the breakpoint used in AppHeader for consistency.
   */
  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FrontendSessionUser | null>(null);

  // Re-read identity cookies on mount and whenever a profile edit broadcasts a change.
  useEffect(() => {
    setCurrentUser(getFrontendSessionUser());
    const refresh = () => setCurrentUser(getFrontendSessionUser());
    window.addEventListener(SESSION_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, refresh);
  }, []);

  const showLabels = isExpanded || isMobileOpen || isHovered;
  const isActive = buildActiveMatcher(pathname);
  const userRole = normalizeRole(currentUser?.role);

  const visibleGroups = userRole
    ? NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!hasMinRole(userRole, item.minRole)) return false;
          if (item.maxRole && hasMinRole(userRole, item.maxRole)) return false;
          return true;
        }),
      })).filter((group) => group.items.length > 0)
    : [];

  useEffect(() => {
    for (const group of visibleGroups) {
      for (const it of group.items) {
        const children = (it as { children?: { href: string }[] }).children;
        if (children?.some((c) => isActive(c.href))) {
          setOpenDropdown(it.label);
          return;
        }
      }
    }
  }, [pathname, visibleGroups]);

  const renderItems = (items: NavItem[]) => (
    <ul className="flex  flex-col gap-1">
      {items.map((item) => {
        const active = isActive(item.path);
        const dropOpen = openDropdown === item.name;

        if (item.children && item.children.length > 0) {
          const childActive = item.children.some((c) => isActive(c.path));
          return (
            <li key={item.name}>
              <button
                type="button"
                onClick={() => setOpenDropdown(dropOpen ? null : item.name)}
                aria-expanded={dropOpen}
                title={!showLabels ? item.name : undefined}
                className={`group relative w-full flex items-center gap-3 rounded-xl px-2.5 py-1.5 transition-colors duration-150 ${
                  childActive
                    ? 'text-red-600 dark:text-red-300 font-medium shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100/70 dark:text-gray-300 dark:hover:bg-gray-800/60'
                }`}
              >
                <NavIcon active={childActive} icon={item.icon} />
                {showLabels && (
                  <>
                    <span className="flex-1 text-left text-[12px] font-medium font-sans leading-tight truncate">
                      {item.name}
                    </span>
                    <ChevronRight
                      size={14}
                      strokeWidth={2.4}
                      className={`shrink-0 text-gray-400 transition-transform duration-200 ${dropOpen ? 'rotate-90' : ''}`}
                    />
                  </>
                )}
              </button>

              {dropOpen && showLabels && (
                <ul className="mt-1 mb-1 ml-[34px] flex flex-col gap-0.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                  {item.children.map((child) => {
                    const cActive = isActive(child.path);
                    return (
                      <li key={child.name}>
                        <Link
                          href={child.path}
                          aria-current={cActive ? 'page' : undefined}
                          className={`flex items-center gap-2.5  px-2.5 py-1.5 text-[11.5px] font-medium font-sans transition-colors duration-150 ${
                              cActive
                              ? 'text-red-600 dark:text-red-300 font-medium'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50'
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                              cActive ? 'bg-burgundy dark:bg-red-400' : ' dark:bg-gray-600'
                            }`}
                          />
                          {child.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        }

        /* ── leaf nav item ── */
        return (
          <li key={item.name}>
            <Link
              href={item.path}
              aria-current={active ? 'page' : undefined}
              title={!showLabels ? item.name : undefined}
              className={`group relative flex items-center gap-1 rounded px-2.5 py-1.5 transition-colors duration-150 ${
                active
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300 font-medium shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100/70 dark:text-gray-300 dark:hover:bg-gray-800/60'
              }`}
            >
          
              <NavIcon active={active} icon={item.icon} />
              {showLabels && (
                <span className="flex-1 truncate text-[12px] font-medium font-sans leading-tight">
                  {item.name}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 no-scrollbar bottom-0 left-0 z-50 flex max-w-[250px] flex-col border border-gray-200 bg-white font-sans text-[13px] dark:border-gray-800 dark:bg-gray-900 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", fontSize: '13px' }}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex shrink-0 items-center justify-center border-b border-gray-200 px-2 py-4 dark:border-gray-800">
        <Link href="/" className="flex w-full items-center justify-center">
          <span className="flex shrink-0 items-center justify-center">
            <Image src="/logoblack.png" alt="Everlasting Hills" width={28} height={28} className="object-contain brightness-0 invert" />
          </span>
        </Link>

        {/*
          Sidebar toggle.
          - Desktop (>=1024): collapses the rail to icons only / expands back
          - Mobile  (<1024):  closes the slide-over drawer
          - Hidden when sidebar is in icon-only state on desktop so the collapsed rail stays
            visually clean (the AppHeader hamburger handles re-expanding from there).
        */}
        {showLabels && (
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isMobileOpen ? 'Close sidebar' : 'Collapse sidebar'}
            title={isMobileOpen ? 'Close' : 'Collapse'}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
              text-gray-400 hover:bg-gray-100 hover:text-gray-700
              dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200
              transition-colors duration-150"
          >
            {isMobileOpen ? <X size={18} strokeWidth={2} /> : <PanelLeftClose size={18} strokeWidth={1.9} />}
          </button>
        )}
      </div>

      <div className="flex-1 no-scrollbar overflow-y-auto overflow-x-hidden px-1 py-4">
        <nav className="space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.section ?? 'root'}>
              {group.section && <div className="mx-3 my-3 h-px bg-gray-100 dark:bg-gray-800" />}

              {renderItems(
                group.items.map((it) => ({
                  name: it.label,
                  path: it.href,
                  icon: it.icon ? React.createElement(it.icon, { size: 17, strokeWidth: 1.9, className: 'text-current' }) : null,
                  children: (it as { children?: { label: string; href: string }[] }).children?.map((c) => ({ name: c.label, path: c.href })),
                }))
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-gray-100 p-2 dark:border-gray-800">
        <Link
          href="/dashboard/profile"
          title={`${currentUser?.fullName ?? currentUser?.email ?? 'Loading...'} · ${userRole ? ROLE_LABELS[userRole] : 'Loading...'}`}
          className="flex items-center justify-center rounded-xl py-1.5 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800/60"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-burgundy/10 dark:bg-burgundy/20">
            {currentUser?.picture ? (
              <img src={currentUser.picture} alt={currentUser.fullName ?? currentUser.email ?? 'User avatar'} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[12px] font-bold font-sans text-burgundy dark:text-red-300">{getInitials(currentUser?.fullName, currentUser?.email)}</span>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900" />
          </span>
        </Link>
      </div>

      {showLabels ? (
        <div className="absolute left-[50px] top-0 h-full max-w-[250px] border-r border-l-0 border-gray-200/80 bg-white shadow-[8px_0_30px_rgba(0,0,0,0.08)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-[8px_0_30px_rgba(0,0,0,0.35)] lg:block">
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy/10 dark:bg-burgundy/20">
                <Image src="/logoblack.png" alt="Everlasting Hills" width={24} height={24} className="object-contain brightness-0 invert" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-gray-900 dark:text-white">Everlasting Hills</p>
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Church Portal</p>
              </div>
            </div>

            <div className="flex-1 no-scrollbar overflow-y-auto px-3 py-4">
              <nav className="space-y-6">
                {visibleGroups.map((group) => (
                  <div key={`${group.section ?? 'root'}-labels`}>
                    {group.section && (
                      <p className="mb-2 px-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                        {group.section}
                      </p>
                    )}
                    {renderItems(
                      group.items.map((it) => ({
                        name: it.label,
                        path: it.href,
                        icon: it.icon ? React.createElement(it.icon, { size: 17, strokeWidth: 1.9, className: 'text-current' }) : null,
                        children: (it as { children?: { label: string; href: string }[] }).children?.map((c) => ({ name: c.label, path: c.href })),
                      }))
                    )}
                  </div>
                ))}
              </nav>
            </div>

            <div className="shrink-0 border-t border-gray-100 p-3 dark:border-gray-800">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-2.5 ring-1 ring-gray-200/60 transition-colors hover:bg-gray-100 dark:bg-gray-800/60 dark:ring-gray-700/50 dark:hover:bg-gray-800"
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-burgundy/10 dark:bg-burgundy/20">
                  {currentUser?.picture ? (
                    <img src={currentUser.picture} alt={currentUser.fullName ?? currentUser.email ?? 'User avatar'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[12px] font-bold text-burgundy dark:text-red-300">{getInitials(currentUser?.fullName, currentUser?.email)}</span>
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold leading-tight text-gray-800 dark:text-gray-100">{currentUser?.fullName ?? '-'}</p>
                  <p
                    className="truncate text-[10px] font-medium text-gray-400 dark:text-gray-500"
                    title={currentUser?.email ?? undefined}
                  >
                    {truncateText(currentUser?.email) || '-'}
                  </p>
                  {userRole && <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">{ROLE_LABELS[userRole]}</p>}
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
};

export default AppSidebar;