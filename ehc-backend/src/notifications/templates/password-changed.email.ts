import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';
import { CHURCH_INFO } from '../church-info';

interface Args {
  email: string;
  firstName?: string;
  when: Date;
  ip?: string;
  /** Public site URL, no trailing slash. */
  appUrl: string;
}

/**
 * Security confirmation sent after a member's password is changed — covers both
 * the forced first-login change and password-reset completion (both land on the
 * same change-password endpoint). States when + from where, and how to recover
 * if it wasn't them.
 */
export function buildPasswordChangedEmail({ email, firstName, when, ip, appUrl }: Args): SendEmailPayload {
  const base = appUrl.replace(/\/$/, '');
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const ts = when.toUTCString();
  const forgotUrl = `${base}/forgot-password`;

  const subject = 'Your Everlasting Hills password was changed';

  const text = [
    greeting,
    '',
    'This confirms that the password for your Everlasting Hills member account was just changed.',
    '',
    `  When: ${ts}`,
    ...(ip ? [`  IP address: ${ip}`] : []),
    '',
    'If this was you, no further action is needed.',
    `If this wasn't you, reset your password immediately: ${forgotUrl}`,
    `and let us know at ${CHURCH_INFO.email}.`,
    '',
    '— Everlasting Hills Church',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">This confirms that the password for your Everlasting Hills member account was just changed.</p>
    <div style="background:#FFF;border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin:0 0 20px">
      <p style="margin:0 0 ${ip ? '8px' : '0'};font-size:14px;color:#111"><strong>When:</strong> ${escapeHtml(ts)}</p>
      ${ip ? `<p style="margin:0;font-size:14px;color:#111"><strong>IP address:</strong> ${escapeHtml(ip)}</p>` : ''}
    </div>
    <p style="margin:0 0 8px">If this was you, no further action is needed.</p>
    <p style="margin:0;color:#87102C"><strong>If this wasn't you</strong>, reset your password right away using the button below, and let us know at <a href="mailto:${CHURCH_INFO.email}" style="color:#87102C">${CHURCH_INFO.email}</a>.</p>
  `;

  const html = renderEmailLayout({
    heading: 'Your password was changed',
    bodyHtml,
    cta: { label: 'Secure my account', href: forgotUrl },
  });

  return { to: email, subject, text, html, tag: 'password-changed' };
}
