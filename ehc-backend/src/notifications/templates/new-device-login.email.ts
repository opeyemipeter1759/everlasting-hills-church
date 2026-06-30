import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';
import { CHURCH_INFO } from '../church-info';

interface Args {
  email: string;
  firstName?: string;
  /** Human-readable device label, e.g. "Chrome on Windows". */
  device: string;
  ip?: string;
  when: Date;
  /** Public site URL, no trailing slash. */
  appUrl: string;
}

/**
 * Security alert sent when a member signs in from a device/browser we haven't
 * seen on their account before. States device, IP, and time, and gives a clear
 * "wasn't me" recovery path.
 */
export function buildNewDeviceLoginEmail({ email, firstName, device, ip, when, appUrl }: Args): SendEmailPayload {
  const base = appUrl.replace(/\/$/, '');
  const forgotUrl = `${base}/forgot-password`;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const ts = when.toUTCString();

  const subject = 'New sign-in to your Everlasting Hills account';

  const text = [
    greeting,
    '',
    'We noticed a sign-in to your Everlasting Hills account from a device we have not seen before.',
    '',
    `  Device: ${device}`,
    ...(ip ? [`  IP address: ${ip}`] : []),
    `  When: ${ts}`,
    '',
    'If this was you, you can ignore this email.',
    `If this WASN'T you, reset your password immediately: ${forgotUrl}`,
    `and contact us at ${CHURCH_INFO.email}.`,
    '',
    '— Everlasting Hills Church',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">We noticed a sign-in to your Everlasting Hills account from a device we haven't seen before.</p>
    <div style="background:#FFF;border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin:0 0 20px">
      <p style="margin:0 0 8px;font-size:14px;color:#111"><strong>Device:</strong> ${escapeHtml(device)}</p>
      ${ip ? `<p style="margin:0 0 8px;font-size:14px;color:#111"><strong>IP address:</strong> ${escapeHtml(ip)}</p>` : ''}
      <p style="margin:0;font-size:14px;color:#111"><strong>When:</strong> ${escapeHtml(ts)}</p>
    </div>
    <p style="margin:0 0 8px">If this was you, no action is needed.</p>
    <p style="margin:0;color:#87102C"><strong>If this wasn't you</strong>, secure your account right away and let us know at <a href="mailto:${CHURCH_INFO.email}" style="color:#87102C">${CHURCH_INFO.email}</a>.</p>
  `;

  const html = renderEmailLayout({
    heading: 'New sign-in detected',
    bodyHtml,
    cta: { label: 'Secure my account', href: forgotUrl },
  });

  return { to: email, subject, text, html, tag: 'new-device-login' };
}
