import { serverApi, type ApiError } from "@/lib/api/server";

/**
 * Shared types + helpers across all role-specific dashboard loaders.
 * Keeping these here avoids each loader re-declaring the same MeResponse / safeGet wrapper.
 */

// ── /auth/me ────────────────────────────────────────────────────────────────
export interface MeResponse {
  profileId: string | null;
  role: string | null;
  tenantId: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: string | null;
    bio: string | null;
    photoUrl: string | null;
    joinedAt: string;
  } | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * EHC-XXXX display ID derived from the member UUID's tail. Pure function, easily unit-testable.
 */
export function getMemberDisplayId(id: string | null | undefined): string {
  if (!id) return "EHC-NEW";
  return `EHC-${id.replace(/-/g, "").slice(-4).toUpperCase()}`;
}

/**
 * Narrow the loose `role: string | null` to a known role union.
 * Pure function — covered by tests.
 */
export type AppRole = "MEMBER" | "UNIT_LEAD" | "ADMIN" | "PASTOR" | "SUPER_ADMIN";

export function normalizeRole(role: string | null | undefined): AppRole | null {
  if (!role) return null;
  const upper = role.toUpperCase();
  if (
    upper === "MEMBER" ||
    upper === "UNIT_LEAD" ||
    upper === "ADMIN" ||
    upper === "PASTOR" ||
    upper === "SUPER_ADMIN"
  ) {
    return upper;
  }
  return null;
}

/**
 * Returns null on auth/network failure rather than throwing.
 * A transient backend hiccup degrades to a partial UI instead of an error boundary.
 */
export async function safeGet<T>(path: string): Promise<T | null> {
  try {
    return await serverApi.get<T>(path, { cache: "no-store" });
  } catch (err) {
    const status = (err as ApiError).status;
    if (status === 401 || status === 403 || status === 404) return null;
    console.error(`[dashboard] ${path} failed:`, (err as Error).message ?? err);
    return null;
  }
}
