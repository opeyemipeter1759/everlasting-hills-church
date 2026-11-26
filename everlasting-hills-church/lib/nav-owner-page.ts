// Edge-safe (used by middleware): no React or browser-only imports.

/**
 * Screens with no sidebar link of their own that are opened from another page
 * and belong to it, so a permission for that page (a role added to it, or a
 * named grant) covers them too. The CMS's Homepage row opens the homepage
 * editor, so people given the CMS can edit the homepage like every other page.
 */
const OPENED_FROM: Record<string, string> = {
  "/dashboard/settings/homepage": "/dashboard/cms",
};

/** The nav item that owns `pathname` when it's a screen opened from another page, else null. */
export function ownerPageFor<T extends { href: string }>(pathname: string, items: T[]): T | null {
  for (const [prefix, href] of Object.entries(OPENED_FROM)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return items.find((item) => item.href === href) ?? null;
  }
  return null;
}
