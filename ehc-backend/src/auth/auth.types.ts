export interface LoginContext {
  ip?: string;
  userAgent?: string;
}

export interface UserProfileSummary {
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  memberStatus: string | null;
}

/** Best-effort human label from a User-Agent string (no external dependency). */
export function describeUserAgent(ua: string): string {
  if (!ua) return 'Unknown device';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua) && !/Chrome/.test(ua)
            ? 'Safari'
            : 'a browser';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iPod|iOS/.test(ua)
        ? 'iOS'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'an unknown OS';
  return `${browser} on ${os}`;
}
