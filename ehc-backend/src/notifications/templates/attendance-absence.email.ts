import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingName, greetingText, renderEmailLayout } from './layout';
import { CHURCH_INFO } from '../church-info';

interface Args {
  email: string;
  firstName: string | null;
  /** e.g. "Sunday Service" / "Midweek Service" — the human label, not the row name. */
  serviceLabel: string;
  /** Public site URL, no trailing slash. */
  appUrl: string;
}

/**
 * "We missed you" — sent to every active member who was marked absent once a
 * service's attendance window has closed. Pastoral in tone: no guilt, no
 * streak counters, one warm line and an open door. The point is to make
 * someone feel noticed, not tracked.
 */
export function buildAttendanceAbsenceEmail({ email, firstName, serviceLabel, appUrl }: Args): SendEmailPayload {
  const base = appUrl.replace(/\/$/, '');
  const name = greetingName(firstName);
  const subject = name ? `We missed you at ${serviceLabel}, ${name}` : `We missed you at ${serviceLabel}`;

  const text = [
    greetingText(firstName),
    '',
    `We noticed you weren't with us at ${serviceLabel} today, and we simply wanted you to know you were missed.`,
    '',
    "We hope all is well with you. If anything is going on — something to pray about, or something we can help with — just reply to this email; it comes straight to the church.",
    '',
    'When you are ready, we would love to see you again:',
    ...CHURCH_INFO.services.map((s) => `  • ${s.name}: ${s.time.trim()}`),
    `  ${CHURCH_INFO.address}`,
    '',
    'You are part of this family, and there is always a seat with your name on it.',
    '',
    '— Everlasting Hills Church · Ibadan',
  ].join('\n');

  const serviceRows = CHURCH_INFO.services
    .map(
      (s) =>
        `<tr><td style="padding:6px 0;font-weight:700;color:#111;font-size:11pt">${escapeHtml(s.name)}</td><td style="padding:6px 0;color:#4B5563;text-align:right;font-size:11pt">${escapeHtml(s.time.trim())}</td></tr>`,
    )
    .join('');

  const bodyHtml = `
    ${greetingHtml(firstName)}
    <p style="margin:0 0 16px">We noticed you weren't with us at <strong>${escapeHtml(serviceLabel)}</strong> today, and we simply wanted you to know you were missed.</p>
    <p style="margin:0 0 20px">We hope all is well with you. If anything is going on — something to pray about, or something we can help with — just reply to this email; it comes straight to the church.</p>

    <div style="background:#FFF4F6;border:1px solid #E7CDD3;border-radius:12px;padding:18px 20px;margin:0 0 22px">
      <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:800;color:#87102C">See you soon</p>
      <table style="width:100%;border-collapse:collapse">${serviceRows}</table>
      <p style="margin:12px 0 0;font-size:13px;color:#4B5563">📍 ${escapeHtml(CHURCH_INFO.address)}</p>
    </div>

    <p style="margin:0">You are part of this family, and there is always a seat with your name on it.</p>
  `;

  const html = renderEmailLayout({
    heading: `We missed you${name ? `, ${escapeHtml(name)}` : ''}.`,
    bodyHtml,
    cta: { label: 'Share a prayer request', href: `${base}/prayer-request` },
  });

  return { to: email, subject, text, html, tag: 'attendance-absence' };
}
