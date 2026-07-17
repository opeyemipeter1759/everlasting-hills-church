'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';
import { NAV_GROUPS, ROLE_LABELS, hasMinRole } from '@/config/config';
import { normalizeRole } from '@/lib/auth/frontend-session';
import Image from 'next/image';
import { useCurrentUser, useNavDropdown } from '@/hooks';
import { useMyUnit } from '@/lib/api';
import { useFollowUpAccess } from '@/lib/api/follow-up-pipeline';
import { getInitials, truncateText } from '@/utils/stringUtils';
import { SidebarSkeleton } from '@/components/ui/skeleton/SidebarSkeleton';

type NavItem = {
  name: string;
  icon?: React.ReactNode;
  path: string;
  children?: NavItem[];
};

// Paths that are parents of other nav items must match exactly so child
// routes don't also highlight the parent as active.
const EXACT_MATCH_PATHS = new Set(['/dashboard', '/dashboard/admin']);

/**
 * Nav items can share a path prefix (e.g. "/dashboard/pastor/sermons" and
 * "/dashboard/pastor/sermons/analytics"). Rather than matching each item's href
 * independently — which lights up every ancestor of the current path — find the
 * single longest href among all rendered items that matches, and treat only that
 * one as active.
 */
function buildActiveMatcher(pathname: string | null, allPaths: string[]) {
  const rawMatch = (path: string): boolean => {
    if (!pathname) return false;
    if (EXACT_MATCH_PATHS.has(path)) return pathname === path;
    return pathname === path || pathname.startsWith(path + '/');
  };
  const bestMatch = allPaths.filter(rawMatch).sort((a, b) => b.length - a.length)[0];
  return (path: string): boolean => path === bestMatch;
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
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/logo.png' : '/logoblack.png';

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  const pathname = usePathname();
  const currentUser = useCurrentUser();

  const showLabels = isExpanded || isMobileOpen || isHovered;
  const userRole = normalizeRole(currentUser?.role);

  // Data-driven checks beyond the static role gate — see NavItem.requiresAccess.
  // Undefined while loading is treated as "no access yet" so a link never flashes
  // and then disappears.
  const { data: myUnit } = useMyUnit();
  const { data: followUpAccess } = useFollowUpAccess();

  const visibleGroups = userRole
    ? NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!hasMinRole(userRole, item.minRole)) return false;
          if (item.maxRole && hasMinRole(userRole, item.maxRole)) return false;
          if (item.requiresAccess === 'unitLead' && !myUnit) return false;
          if (item.requiresAccess === 'followUp' && !followUpAccess?.hasAccess) return false;
          return true;
        }),
      })).filter((group) => group.items.length > 0)
    : [];

  const allPaths = visibleGroups.flatMap((group) =>
    group.items.flatMap((item) => [
      item.href,
      ...((item as { children?: { href: string }[] }).children ?? []).map((c) => c.href),
    ])
  );
  const isActive = buildActiveMatcher(pathname, allPaths);

  const { openDropdown, setOpenDropdown } = useNavDropdown(pathname, visibleGroups, isActive);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    const allSections = new Set(NAV_GROUPS.map((g) => g.section).filter(Boolean) as string[]);
    for (const group of NAV_GROUPS) {
      if (group.section && group.items.some((item) => {
        if (isActive(item.href)) return true;
        return (item as { children?: { href: string }[] }).children?.some((c) => isActive(c.href)) ?? false;
      })) {
        allSections.delete(group.section);
      }
    }
    return allSections;
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  };

  const renderItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-0.5">
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
                className={`group w-full flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-150 ${
                  childActive
                    ? 'text-red-600 dark:text-red-300 font-medium'
                    : 'text-gray-700 hover:bg-gray-100/70 dark:text-gray-300 dark:hover:bg-gray-800/60'
                }`}
              >
                <NavIcon active={childActive} icon={item.icon} />
                {showLabels && (
                  <>
                    <span className="flex-1 text-left text-[12.5px] font-medium leading-tight truncate">
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
                <ul className="mt-0.5 mb-1 ml-[34px] flex flex-col gap-0.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                  {item.children.map((child) => {
                    const cActive = isActive(child.path);
                    return (
                      <li key={child.name}>
                        <Link
                          href={child.path}
                          aria-current={cActive ? 'page' : undefined}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 text-[11.5px] font-medium transition-colors duration-150 rounded-lg ${
                            cActive
                              ? 'text-red-600 dark:text-red-300'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                              cActive ? 'bg-burgundy dark:bg-red-400' : 'bg-gray-300 dark:bg-gray-600'
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

        return (
          <li key={item.name}>
            <Link
              href={item.path}
              aria-current={active ? 'page' : undefined}
              title={!showLabels ? item.name : undefined}
              className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-150 ${
                active
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300 font-medium'
                  : 'text-gray-700 hover:bg-gray-100/70 dark:text-gray-300 dark:hover:bg-gray-800/60'
              }`}
            >
              <NavIcon active={active} icon={item.icon} />
              {showLabels && (
                <span className="flex-1 truncate text-[12.5px] font-medium leading-tight">
                  {item.name}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const sidebarW = showLabels ? 'lg:w-[240px]' : 'lg:w-[65px]';

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col no-scrollbar
        border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900
        font-sans text-[13px] transition-all duration-300 ease-in-out
        w-[240px] ${sidebarW}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="navigation"
      aria-label="Main navigation"
    >
      {currentUser === null ? (
        <SidebarSkeleton showLabels={showLabels} />
      ) : (
      <>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-[16px] dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <Image src={logoSrc} alt="Everlasting Hills" width={42} height={22} className="object-cover py-1.5" />
          {showLabels && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-gray-900 dark:text-white leading-tight">
                Everlasting Hills
              </p>
              <p className="truncate text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                Church Portal
              </p>
            </div>
          )}
        </Link>

        {showLabels && (
          <button
            type="button"
            onClick={handleToggle}
            aria-label={isMobileOpen ? 'Close sidebar' : 'Collapse sidebar'}
            className="shrink-0 inline-flex h-9 w-7 items-center justify-center rounded-lg
              text-gray-400 hover:bg-gray-100 hover:text-gray-700
              dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200
              transition-colors duration-150"
          >
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 no-scrollbar overflow-y-auto overflow-x-hidden px-2 py-3">
        <nav className="space-y-5">
          {visibleGroups.map((group) => {
            const sectionKey = group.section ?? 'root';
            const isCollapsed = group.section ? collapsedSections.has(group.section) : false;
            return (
            <div key={sectionKey}>
              {group.section && showLabels && (
                <button
                  type="button"
                  onClick={() => toggleSection(group.section!)}
                  className="mb-1.5 flex w-full items-center justify-between px-2.5 group"
                >
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    {group.section}
                  </span>
                  <ChevronRight
                    size={11}
                    strokeWidth={2.5}
                    className={`text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                  />
                </button>
              )}
              {group.section && !showLabels && (
                <div className="mx-2 my-2 h-px bg-gray-100 dark:bg-gray-800" />
              )}
              {!isCollapsed && renderItems(
                group.items.map((it) => ({
                  name: it.label,
                  path: it.href,
                  icon: it.icon
                    ? React.createElement(it.icon, { size: 17, strokeWidth: 1.9, className: 'text-current' })
                    : null,
                  children: (it as { children?: { label: string; href: string }[] }).children?.map((c) => ({
                    name: c.label,
                    path: c.href,
                  })),
                }))
              )}
            </div>
          );
          })}
        </nav>
      </div>

      {/* User profile */}
      <div className="shrink-0 border-t border-gray-100 p-2 dark:border-gray-800">
        <Link
          href="/dashboard/profile"
          className={`flex items-center rounded-xl py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/60 ${
            showLabels ? 'gap-3 px-2' : 'justify-center px-1'
          }`}
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-burgundy/10 dark:bg-burgundy/20">
            {currentUser?.picture ? (
              <img
                src={currentUser.picture}
                alt={currentUser.fullName ?? currentUser.email ?? 'User avatar'}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[11px] font-bold text-burgundy dark:text-red-300">
                {getInitials(currentUser?.fullName, currentUser?.email)}
              </span>
            )}
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900" />
          </span>
          {showLabels && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold leading-tight text-gray-800 dark:text-gray-100">
                {currentUser?.fullName ?? '-'}
              </p>
              <p className="truncate text-[10px] font-medium text-gray-400 dark:text-gray-500">
                {truncateText(currentUser?.email) || '-'}
              </p>
              {userRole && (
                <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {ROLE_LABELS[userRole]}
                </p>
              )}
            </div>
          )}
        </Link>
      </div>
      </>
      )}
    </aside>
  );
};

export default AppSidebar;
