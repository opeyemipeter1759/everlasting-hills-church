import { Role } from '@prisma/client';

/**
 * Which API endpoints each restricted dashboard page uses, and the role that
 * page normally requires.
 *
 * A page permission (Role Access Permissions screen: a role added to a page,
 * or a named grant for a person/unit) means "can do everything on that page".
 * The frontend already lets such people onto the page; PageAccessGuard uses
 * this table to let them through the API calls the page makes, by treating
 * them as holding `role` for requests under `paths`.
 *
 * `href` must match the nav item's href in the frontend's config/config.ts
 * (NAV_ITEMS_FLAT) — that is the key permissions are saved under. `role` is
 * that item's default minRole. `paths` are API path prefixes, matched on
 * whole segments ('/units' covers '/units/123' but not '/units-x').
 *
 * When a page starts calling a new endpoint, add its prefix here, or people
 * given the page by permission will get "permission denied" on that call.
 */
export interface PageAccessEntry {
  href: string;
  role: Role;
  paths: string[];
}

export const PAGE_ACCESS: PageAccessEntry[] = [
  // ── Administration ────────────────────────────────────────────────────────
  {
    href: '/dashboard/admin',
    role: Role.ADMIN,
    paths: [
      '/admin',
      '/overview',
      '/visitors',
      '/members/birthdays',
      '/members/anniversaries',
      '/members/at-risk',
      '/members/absent',
      '/members/follow-ups',
      '/events/admin',
      '/pledges',
      '/follow-up',
      '/cms/audit',
      '/ai',
    ],
  },
  { href: '/dashboard/admin/announcements', role: Role.ADMIN, paths: ['/announcements', '/emails', '/uploads/image', '/ai'] },
  { href: '/dashboard/admin/attendance', role: Role.ADMIN, paths: ['/attendance', '/headcount', '/online-attendance'] },
  { href: '/dashboard/admin/books', role: Role.ADMIN, paths: ['/books', '/book-collections', '/uploads/image'] },
  { href: '/dashboard/admin/calendar', role: Role.ADMIN, paths: ['/events', '/calendar'] },
  { href: '/dashboard/admin/courses', role: Role.ADMIN, paths: ['/courses', '/uploads/image'] },
  { href: '/dashboard/admin/departments', role: Role.ADMIN, paths: ['/departments', '/units', '/members/search'] },
  { href: '/dashboard/admin/emails', role: Role.ADMIN, paths: ['/emails', '/uploads'] },
  { href: '/dashboard/admin/events', role: Role.ADMIN, paths: ['/events', '/uploads/image'] },
  {
    href: '/dashboard/admin/first-timers',
    role: Role.ADMIN,
    paths: ['/visitors', '/admin/first-timer', '/members/convert-visitor', '/online-attendance', '/ai'],
  },
  { href: '/dashboard/admin/gatherings', role: Role.ADMIN, paths: ['/gatherings'] },
  { href: '/dashboard/admin/home-cell', role: Role.ADMIN, paths: ['/home-cell'] },
  { href: '/dashboard/admin/inventory', role: Role.ADMIN, paths: ['/inventory', '/departments', '/uploads/image'] },
  { href: '/dashboard/admin/members', role: Role.ADMIN, paths: ['/members', '/users', '/assignments', '/units'] },
  { href: '/dashboard/admin/online-audience', role: Role.ADMIN, paths: ['/online-attendance'] },
  { href: '/dashboard/admin/pledges', role: Role.ADMIN, paths: ['/pledges'] },
  { href: '/dashboard/admin/reading', role: Role.ADMIN, paths: ['/reading-monitor'] },
  {
    href: '/dashboard/admin/roles',
    role: Role.ADMIN,
    paths: ['/users', '/units', '/departments', '/members/directory', '/assignments'],
  },
  { href: '/dashboard/admin/service-teams', role: Role.ADMIN, paths: ['/service-teams', '/departments', '/units'] },
  { href: '/dashboard/admin/services', role: Role.ADMIN, paths: ['/attendance/services'] },
  { href: '/dashboard/admin/units', role: Role.ADMIN, paths: ['/units', '/members/search'] },
  { href: '/dashboard/analytics/attendance', role: Role.ADMIN, paths: ['/analytics'] },
  { href: '/dashboard/analytics/growth', role: Role.ADMIN, paths: ['/visitors', '/admin/first-timer'] },
  { href: '/dashboard/prayer-requests', role: Role.ADMIN, paths: ['/forms/prayer-requests'] },
  { href: '/dashboard/questions', role: Role.ADMIN, paths: ['/forms/questions'] },
  {
    href: '/dashboard/settings/homepage',
    role: Role.ADMIN,
    paths: ['/site-settings', '/testimonials', '/uploads/image', '/ai'],
  },
  { href: '/dashboard/testimonies', role: Role.ADMIN, paths: ['/testimonials', '/ai'] },

  // ── Departments, units, ushering ──────────────────────────────────────────
  {
    href: '/dashboard/my-department',
    role: Role.HOD,
    paths: ['/departments', '/units', '/status-reports', '/emails', '/uploads/document'],
  },
  {
    href: '/dashboard/my-department/reports',
    role: Role.ADMIN_HEAD,
    paths: ['/status-reports', '/departments', '/units', '/emails', '/uploads/document'],
  },
  {
    href: '/dashboard/unit-lead',
    role: Role.UNIT_LEAD,
    paths: ['/units', '/status-reports', '/emails', '/uploads/document', '/members/search'],
  },
  { href: '/dashboard/admin/usher', role: Role.HEAD_USHER, paths: ['/headcount', '/attendance/services'] },
  { href: '/dashboard/usher', role: Role.HEAD_USHER, paths: ['/headcount', '/attendance/services'] },

  // ── Pastoral ──────────────────────────────────────────────────────────────
  { href: '/dashboard/cms', role: Role.PASTOR, paths: ['/cms', '/uploads/image'] },
  { href: '/dashboard/pastor/follow-ups', role: Role.PASTOR, paths: ['/follow-up'] },
  { href: '/dashboard/pastor/reports', role: Role.PASTOR, paths: ['/status-reports', '/emails', '/uploads/document'] },
  { href: '/dashboard/pastor/sermons/analytics', role: Role.PASTOR, paths: ['/sermons/analytics'] },

  // ── Super admin ───────────────────────────────────────────────────────────
  { href: '/dashboard/admin/permissions', role: Role.SUPER_ADMIN, paths: ['/nav-permissions'] },
  { href: '/dashboard/audit-log', role: Role.SUPER_ADMIN, paths: ['/status-reports'] },
];

/** True when `path` is `prefix` itself or sits under it on a segment boundary. */
export function pathUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}
