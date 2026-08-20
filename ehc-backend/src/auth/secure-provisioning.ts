import { randomBytes } from 'crypto';

/** Generate a high-entropy credential that is never disclosed to the user. */
export function generateUnusableInitialPassword(): string {
  return randomBytes(48).toString('base64url');
}

export function passwordSetupRedirect(appUrl: string): string {
  return `${appUrl.replace(/\/$/, '')}/change-password`;
}
