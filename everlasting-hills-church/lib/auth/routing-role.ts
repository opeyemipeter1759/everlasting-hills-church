export interface RoutingRoleSources {
  /** Whether a successful authenticated refresh supplied `refreshedRole`. */
  hasRefreshedSession?: boolean;
  /** Role returned by the authenticated Nest refresh endpoint. */
  refreshedRole?: string | null;
  /** Role inside a signature/issuer/audience/expiry-verified access JWT. */
  signedRole?: string | null;
  /** Display-only browser cookie, used solely as a role-change signal. */
  untrustedRoleHint?: string | null;
  /** Authenticated `/auth/me` lookup. Null includes failure (fail-closed). */
  loadBackendRole?: () => Promise<string | null>;
}

/**
 * Resolve a routing role without ever trusting the writable hint itself.
 *
 * Nest resolves effective roles from live assignments/grants, so its
 * authenticated response is authoritative whenever it is available. The JWT
 * claim is only a cryptographically verified fallback for callers that cannot
 * supply a backend loader; a writable browser hint never grants access.
 */
export async function resolveTrustedRoutingRole({
  hasRefreshedSession = false,
  refreshedRole,
  signedRole,
  untrustedRoleHint,
  loadBackendRole,
}: RoutingRoleSources): Promise<string | null> {
  if (hasRefreshedSession) return refreshedRole ?? null;
  if (loadBackendRole) return loadBackendRole();
  return signedRole ?? null;
}
