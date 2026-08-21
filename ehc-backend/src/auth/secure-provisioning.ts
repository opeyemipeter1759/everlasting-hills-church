import { randomBytes, randomInt } from 'crypto';

/** Generate a high-entropy credential that is never disclosed to the user. */
export function generateUnusableInitialPassword(): string {
  return randomBytes(48).toString('base64url');
}

// Excludes visually-ambiguous characters (0/O, 1/I/l) so a temp password read
// off a phone screen and typed by hand doesn't fail on a misread character.
const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/** Generate a real, disclosable temporary password (12 chars) for flows that
 * deliberately email it to the user, e.g. converting a first-timer to a member.
 * Paired with `needs_password_change: true` so the app forces a real password
 * to be chosen on first login — see /change-password enforcement in the login
 * page. Weaker than the link-based setup flow (a compromised inbox gets one
 * working login), used only where that tradeoff has been explicitly chosen. */
export function generateTempPassword(): string {
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)];
  }
  return out;
}

export function passwordSetupRedirect(appUrl: string): string {
  return `${appUrl.replace(/\/$/, '')}/change-password`;
}
