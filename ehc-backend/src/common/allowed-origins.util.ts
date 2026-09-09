/**
 * The same "which frontend origins does this server trust" rule used for CORS
 * (see main.ts), extracted so anything else that needs to validate a
 * browser-supplied origin — e.g. the Google Calendar OAuth callback deciding
 * where to redirect back to — shares one definition instead of drifting.
 */
export interface AllowedOriginsConfig {
  frontendUrl?: string | null;
  extraOrigins?: string[];
  allowVercelPreviews?: boolean;
  isProd?: boolean;
}

const LOCALHOST_DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

export function isAllowedOrigin(origin: string, config: AllowedOriginsConfig): boolean {
  const staticAllowed = new Set<string>(
    [config.frontendUrl, ...(config.extraOrigins ?? []), ...(config.isProd ? [] : LOCALHOST_DEV_ORIGINS)].filter(
      Boolean,
    ) as string[],
  );
  if (staticAllowed.has(origin)) return true;
  if (config.allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}
