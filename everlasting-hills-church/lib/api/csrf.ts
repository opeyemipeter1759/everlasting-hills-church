export function isUnsafeCrossSiteRequest(headers: Pick<Headers, "get">, requestOrigin: string): boolean {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return true;
  if (fetchSite === "same-origin") return false;

  const origin = headers.get("origin");
  if (!origin || origin === requestOrigin) return false;

  // Behind Cloud Run, requestOrigin is the container's internal address, so
  // also accept the public host the browser actually addressed.
  const publicHost = headers.get("x-forwarded-host") ?? headers.get("host");
  try {
    return !publicHost || new URL(origin).host !== publicHost;
  } catch {
    return true;
  }
}
