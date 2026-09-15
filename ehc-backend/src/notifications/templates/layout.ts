/**
 * Shared building blocks for transactional emails. Keeps every template on the
 * same branded shell (burgundy header, white card, muted footer) so we don't
 * re-derive markup per message. Mirrors the look of the member-welcome email.
 */

// Logo lives in the frontend's public/ folder (components/home/Navbar.tsx uses
// the same file — the light variant, for the header's dark maroon background).
// Email clients need a real, publicly reachable URL; there's no local-asset
// embedding. Set FRONTEND_URL in .env so this resolves correctly in production.
const FRONTEND_URL = (process.env.FRONTEND_URL ?? 'https://www.everlastinghills.church').replace(/\/$/, '');
const DEFAULT_LOGO_URL = `${FRONTEND_URL}/logo.png`;

// Admins can swap the header logo from the Emails page (EmailSettings.logoUrl).
// Templates render synchronously from many places, so the override lives here
// as module state: EmailsService loads it on boot and updates it on save.
let logoUrlOverride: string | null = null;
export function setEmailLogoUrl(url: string | null | undefined): void {
  logoUrlOverride = url?.trim() || null;
}
export function getEmailLogoUrl(): string {
  return logoUrlOverride ?? DEFAULT_LOGO_URL;
}

// House style for every email: Arial, 11pt body copy. Web fonts aren't
// reliable across email clients (Outlook desktop strips them outright), and
// Arial renders identically everywhere, so one stack for headings and body
// alike — no @font-face gamble. Templates that size their own copy should use
// BODY_SIZE so nothing drifts from the standard.
export const FONT = `Arial, Helvetica, sans-serif`;
export const BODY_SIZE = '11pt';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Personal greeting ────────────────────────────────────────────────────────
// Every outbound email opens with "Hello Daphne," rather than a faceless blast.
// Templates call these with the recipient's first name; a missing or blank name
// falls back to a plain "Hello," so nobody is ever greeted as "Hello null,".

// The salutation word itself is admin-configurable from the Emails page
// (EmailSettings.greeting — "Dear", "Hi", "Beloved"…). Same module-state
// pattern as the logo: loaded on boot, updated on save.
export const DEFAULT_GREETING = 'Hello';
export const MAX_GREETING_LENGTH = 40;
let greetingOverride: string | null = null;

/** Normalises an admin-typed salutation: trims, collapses whitespace and
 * drops any trailing comma/colon (we add our own after the name). Returns
 * null when nothing usable is left, meaning "use the default". */
export function normalizeGreeting(word: string | null | undefined): string | null {
  const cleaned = (word ?? '').replace(/\s+/g, ' ').trim().replace(/[,:;\s]+$/, '');
  return cleaned ? cleaned.slice(0, MAX_GREETING_LENGTH) : null;
}
export function setEmailGreeting(word: string | null | undefined): void {
  greetingOverride = normalizeGreeting(word);
}
export function getEmailGreeting(): string {
  return greetingOverride ?? DEFAULT_GREETING;
}

/** Tidies a stored first name for display: trims, and takes only the first
 * word so "Daphne Grace" reads as "Hello Daphne,". Returns null when empty. */
export function greetingName(firstName?: string | null): string | null {
  const first = firstName?.trim().split(/\s+/)[0] ?? '';
  if (!first) return null;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Plain-text greeting line, e.g. "Hello Daphne," — for the text/plain part. */
export function greetingText(firstName?: string | null): string {
  const name = greetingName(firstName);
  const word = getEmailGreeting();
  return name ? `${word} ${name},` : `${word},`;
}

/** HTML greeting paragraph to place at the very top of a template's body. */
export function greetingHtml(firstName?: string | null): string {
  return `<p style="font-family:${FONT};color:#111827;font-size:${BODY_SIZE};font-weight:700;margin:0 0 16px">${escapeHtml(greetingText(firstName))}</p>`;
}

/** Admin-typed placeholders such as {{firstName}} or {{ name }} (any case,
 * optional spaces). When a composer body already contains one, the author has
 * chosen where the name goes and the automatic greeting line is skipped. */
const NAME_TOKEN = /\{\{\s*(first_?name|name)\s*\}\}/gi;

export function hasNameToken(s: string): boolean {
  return new RegExp(NAME_TOKEN.source, 'i').test(s);
}

/** Replaces every name token with the recipient's first name (HTML-escaped
 * when `html` is true). A recipient with no usable first name gets "there",
 * so "Hi {{firstName}}" degrades to "Hi there" instead of "Hi ". */
export function fillNameTokens(s: string, firstName: string | null | undefined, html = false): string {
  const name = greetingName(firstName) ?? 'there';
  return s.replace(NAME_TOKEN, html ? escapeHtml(name) : name);
}

interface LayoutArgs {
  /** Heading inside the card. Omit when the body is a complete message on
   * its own (the admin composer) — otherwise it just repeats the subject. */
  heading?: string;
  /** Inner HTML body (already escaped where needed). */
  bodyHtml: string;
  /** Optional single call-to-action button. */
  cta?: { label: string; href: string };
}
export function renderEmailLayout({ heading, bodyHtml, cta }: LayoutArgs): string {
  const ctaHtml = cta
    ? `<div style="text-align:center;margin:32px 0">
        <a href="${cta.href}" style="display:inline-block;background:#87102C;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-family:${FONT};font-weight:700;font-size:${BODY_SIZE};letter-spacing:0.3px">${escapeHtml(cta.label)} →</a>
      </div>`
    : '';

  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><style>body, table, td, p, li, a { font-family: Arial, Helvetica, sans-serif; }</style></head>
  <body style="margin:0;padding:0;background:#F4F4F5;font-family:${FONT};color:#111827">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#87102C,#6E0C24);border-radius:8px;margin-bottom:24px">
  <tr>
    <td style="padding:24px;text-align:center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
        <tr>
          <td style="padding-right:14px;vertical-align:middle;width:52px;height:52px;text-align:center">
            <img src="${getEmailLogoUrl()}" alt="Everlasting Hills Church" style="display:block;border:0;border-radius:8px;max-width:52px;max-height:52px;width:auto;height:auto;object-fit:contain;margin:0 auto" />
          </td>
          <td style="vertical-align:middle;text-align:left">
            <p style="font-family:${FONT};color:#fff;margin:0 0 3px;font-size:18px;text-transform:uppercase;font-weight:700">Everlasting Hills</p>
            <h1 style="font-family:${FONT};color:#fff;margin:0;font-size:16px;font-weight:700;letter-spacing:-0.2px;font-style:italic">Community Church</h1>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

      ${heading ? `<h2 style="font-family:${FONT};color:#111827;font-size:25px;font-weight:700;letter-spacing:-0.3px;line-height:1.3;margin:0 0 14px">${heading}</h2>` : ''}
      <div style="font-family:${FONT};color:#4B5563;font-size:${BODY_SIZE};line-height:1.7">${bodyHtml}</div>
      ${ctaHtml}

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
      <p style="font-family:${FONT};color:#9CA3AF;font-size:11px;margin:0;text-align:center;line-height:1.7;letter-spacing:0.1px">
        Everlasting Hills Community Church · Ibadan, Nigeria<br/>
        Raising men and women who flourish beyond limits.
      </p>
    </div>
  </body>
</html>`;
}
