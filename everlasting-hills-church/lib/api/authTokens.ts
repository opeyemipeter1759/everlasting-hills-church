const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(cookiePrefix));

  return cookie ? decodeURIComponent(cookie.slice(cookiePrefix.length)) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const cookieParts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "SameSite=Lax",
    secure ? "Secure" : "",
  ].filter(Boolean);

  document.cookie = cookieParts.join("; ");
}

function removeCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAccessToken() {
  if (typeof document === "undefined") {
    return null;
  }

  return getCookie(ACCESS_TOKEN_KEY);
}

export function setAuthTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  if (typeof document === "undefined") {
    return;
  }

  if (tokens.accessToken) {
    setCookie(ACCESS_TOKEN_KEY, tokens.accessToken, 60 * 60 * 24 * 7);
  }

  if (tokens.refreshToken) {
    setCookie(REFRESH_TOKEN_KEY, tokens.refreshToken, 60 * 60 * 24 * 30);
  }
}

export function clearAuthTokens() {
  if (typeof document === "undefined") {
    return;
  }

  removeCookie(ACCESS_TOKEN_KEY);
  removeCookie(REFRESH_TOKEN_KEY);
}