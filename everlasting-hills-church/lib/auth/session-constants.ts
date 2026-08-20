/**
 * Session-cookie names shared by browser helpers, middleware, route handlers,
 * and Server Components. The token values themselves are only ever read on the
 * server; exporting the names is not a credential leak.
 */
export const ACCESS_TOKEN_COOKIE = "ehc_access_token";
export const REFRESH_TOKEN_COOKIE = "ehc_refresh_token";
export const ROLE_COOKIE = "ehc_role";
export const EMAIL_COOKIE = "ehc_user_email";
export const FULL_NAME_COOKIE = "ehc_user_full_name";
export const PICTURE_COOKIE = "ehc_user_picture";
export const LOGGED_IN_COOKIE = "ehc_logged_in";
export const LOGOUT_PENDING_COOKIE = "ehc_logout_pending";

export const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function isLogoutPending(value: string | null | undefined): boolean {
  return value === "1";
}
