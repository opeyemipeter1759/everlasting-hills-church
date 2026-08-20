/** Server-only origin for the Nest API. Browser code must use the same-origin BFF. */
export function getBackendBaseUrl(): string {
  const configured =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://localhost:4000";

  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol");
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error("API_BASE_URL must be an absolute http(s) URL for the server-side API proxy");
  }
}

