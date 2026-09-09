// Pure permission-resolution logic shared between the sidebar (browser),
// middleware (Edge runtime) and the admin permissions screen. Deliberately
// free of React/react-query/toast imports so middleware can pull it in
// without dragging browser-only code into the Edge bundle.

import { hasMinRole, type UserRole } from "@/config/config";

/** Every role a nav item's access can be configured for. VISITOR is excluded —
 * it's a public-site concept, no dashboard nav item ever uses it as a minRole. */
export const ALL_CONCRETE_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "PASTOR",
  "ADMIN_HEAD",
  "ADMIN",
  "HOD",
  "HEAD_USHER",
  "UNIT_LEAD",
  "MEMBER",
];

export interface PermissionRoleOption {
  role: UserRole;
  label: string;
  /** Always has access, shown checked and non-interactive — so no combination
   * of edits here can lock the top of the hierarchy out of its own settings. */
  locked?: boolean;
  /** Other role values this checkbox silently carries along, so a legacy
   * ADMIN grant keeps working exactly like ADMIN_HEAD without a second,
   * confusing checkbox for what's the same access level everywhere else. */
  impliedRoles?: UserRole[];
}

/** Curated for display: legacy ADMIN folds into the Admin Head checkbox, and
 * VISITOR never appears — see ALL_CONCRETE_ROLES. */
export const PERMISSION_ROLE_OPTIONS: PermissionRoleOption[] = [
  { role: "SUPER_ADMIN", label: "Super Admin", locked: true },
  { role: "PASTOR", label: "Pastor" },
  { role: "ADMIN_HEAD", label: "Admin Head", impliedRoles: ["ADMIN"] },
  { role: "HOD", label: "Head of Department" },
  { role: "HEAD_USHER", label: "Head Usher" },
  { role: "UNIT_LEAD", label: "Unit Leader" },
  { role: "MEMBER", label: "Member" },
];

export interface NavPermissionEntry {
  itemHref: string;
  roles: UserRole[];
}

export type NavPermissionsMap = Map<string, UserRole[]>;

export function toNavPermissionsMap(entries: NavPermissionEntry[]): NavPermissionsMap {
  return new Map(entries.map((e) => [e.itemHref, e.roles]));
}

/**
 * The role set an item falls back to when no admin override exists: every
 * concrete role that satisfies the item's static `minRole` under the
 * existing hierarchy (hasMinRole) — so an unconfigured item behaves exactly
 * as it always has. Once an admin saves a custom set for an item, that exact
 * set is authoritative instead — no implied hierarchy, by design, since the
 * whole point is granting/revoking per role independently.
 */
export function defaultRolesForItem(minRole: UserRole): UserRole[] {
  return ALL_CONCRETE_ROLES.filter((role) => hasMinRole(role, minRole));
}

/** The effective allowed-role set for one item, override-or-default. Does not
 * include the SUPER_ADMIN bypass — callers check that separately (see
 * `canRoleAccessItem`), since it's unconditional and never actually stored. */
export function effectiveRolesForItem(
  item: { href: string; minRole: UserRole },
  overrides: NavPermissionsMap,
): UserRole[] {
  return overrides.get(item.href) ?? defaultRolesForItem(item.minRole);
}

export function canRoleAccessItem(
  role: UserRole,
  item: { href: string; minRole: UserRole },
  overrides: NavPermissionsMap,
): boolean {
  if (role === "SUPER_ADMIN") return true;
  return effectiveRolesForItem(item, overrides).includes(role);
}

// ── Named exceptions (grant-only) ───────────────────────────────────────────
// Layered on top of the role table above: lets an admin let one specific
// person, or every member/just the leader of one specific unit, into an item
// regardless of their role. Never revokes — revoking still goes through the
// role checkboxes, which is what keeps this an additive-only, low-risk knob.

export type NavGrantType = "MEMBER" | "UNIT_MEMBER" | "UNIT_LEAD";

export const NAV_GRANT_TYPE_LABELS: Record<NavGrantType, string> = {
  MEMBER: "Specific person",
  UNIT_MEMBER: "Everyone in a unit",
  UNIT_LEAD: "A unit's leader",
};

export interface NavPermissionGrantEntry {
  id: string;
  itemHref: string;
  type: NavGrantType;
  targetId: string;
  name: string | null;
  photoUrl: string | null;
}

export interface MatchableNavItem {
  href: string;
  minRole: UserRole;
}

/**
 * The single longest-href item whose href prefixes `pathname` — the same
 * "longest match wins" convention the sidebar uses to decide which link is
 * "active" for a route, reused here so middleware enforces against the exact
 * same item the sidebar shows/hides, rather than a second, separately
 * maintained route table.
 */
export function matchNavItemForPath(pathname: string, items: MatchableNavItem[]): MatchableNavItem | null {
  let best: MatchableNavItem | null = null;
  for (const item of items) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best;
}
