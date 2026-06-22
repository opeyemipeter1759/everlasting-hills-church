/**
 * Shared building blocks for transactional emails. Keeps every template on the
 * same branded shell (burgundy header, white card, muted footer) so we don't
 * re-derive markup per message. Mirrors the look of the member-welcome email.
 */

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

/**
 * Wrap body HTML in the standard EHC email shell. Pass already-safe HTML.
 */
export function renderEmailLayout({ heading, bodyHtml, cta }: LayoutArgs): string {
  const ctaHtml = cta
    ? `<div style="text-align:center;margin:32px 0">
        <a href="${cta.href}" style="display:inline-block;background:#87102C;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.3px">${escapeHtml(cta.label)} →</a>
      </div>`
    : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <div style="background:linear-gradient(135deg,#87102C,#6E0C24);border-radius:16px;padding:32px 24px;text-align:center;margin-bottom:24px">
        <p style="color:#FBD38D;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:700">Everlasting Hills</p>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.3px">Community Church</h1>
      </div>

      <h2 style="color:#111827;font-size:23px;font-weight:800;margin:0 0 12px">${heading}</h2>
      <div style="color:#4B5563;font-size:15px;line-height:1.65">${bodyHtml}</div>
      ${ctaHtml}

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
      <p style="color:#9CA3AF;font-size:11px;margin:0;text-align:center;line-height:1.6">
        Everlasting Hills Community Church · Ibadan, Nigeria<br/>
        Raising men and women who flourish beyond limits.
      </p>
    </div>
  </body>
</html>`;
}
