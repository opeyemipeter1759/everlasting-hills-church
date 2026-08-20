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
const LOGO_URL = `${FRONTEND_URL}/logo.png`;

// Web fonts aren't reliable across email clients (Outlook desktop strips them
// outright), so "professional" here means a deliberate web-safe pairing
// instead of a single generic stack: a serif for headings (echoes the site's
// own Playfair Display headline treatment) and a clean sans for body copy —
// both render natively everywhere, no @font-face gamble.
const SERIF = `Georgia, 'Iowan Old Style', 'Times New Roman', Times, serif`;
const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface LayoutArgs {
  /** Preheader-style heading inside the card. */
  heading: string;
  /** Inner HTML body (already escaped where needed). */
  bodyHtml: string;
  /** Optional single call-to-action button. */
  cta?: { label: string; href: string };
}
export function renderEmailLayout({ heading, bodyHtml, cta }: LayoutArgs): string {
  const ctaHtml = cta
    ? `<div style="text-align:center;margin:32px 0">
        <a href="${cta.href}" style="display:inline-block;background:#87102C;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-family:${SANS};font-weight:700;font-size:14px;letter-spacing:0.3px">${escapeHtml(cta.label)} →</a>
      </div>`
    : '';

  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body style="margin:0;padding:0;background:#F4F4F5;font-family:${SANS};color:#111827">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#87102C,#6E0C24);border-radius:8px;margin-bottom:24px">
  <tr>
    <td style="padding:24px;text-align:center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
        <tr>
          <td style="padding-right:14px;vertical-align:middle;width:52px;height:52px;text-align:center">
            <img src="${LOGO_URL}" alt="Everlasting Hills Church" style="display:block;border:0;border-radius:8px;max-width:52px;max-height:52px;width:auto;height:auto;object-fit:contain;margin:0 auto" />
          </td>
          <td style="vertical-align:middle;text-align:left">
            <p style="font-family:${SANS};color:#fff;margin:0 0 3px;font-size:18px;text-transform:uppercase;font-weight:700">Everlasting Hills</p>
            <h1 style="font-family:${SERIF};color:#fff;margin:0;font-size:16px;font-weight:700;letter-spacing:-0.2px;font-style:italic">Community Church</h1>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

      <h2 style="font-family:${SERIF};color:#111827;font-size:25px;font-weight:700;letter-spacing:-0.3px;line-height:1.3;margin:0 0 14px">${heading}</h2>
      <div style="font-family:${SANS};color:#4B5563;font-size:15px;line-height:1.7">${bodyHtml}</div>
      ${ctaHtml}

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
      <p style="font-family:${SANS};color:#9CA3AF;font-size:11px;margin:0;text-align:center;line-height:1.7;letter-spacing:0.1px">
        Everlasting Hills Community Church · Ibadan, Nigeria<br/>
        Raising men and women who flourish beyond limits.
      </p>
    </div>
  </body>
</html>`;
}
