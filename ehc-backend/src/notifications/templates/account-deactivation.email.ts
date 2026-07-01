import type { SendEmailPayload } from '../notification-events';
import { renderEmailLayout } from './layout';
import { CHURCH_INFO } from '../church-info';

interface Args {
  email: string;
  firstName?: string | null;
  /** Days the member has to reverse the deactivation before data may be removed. */
  reversalDays: number;
  /** Public site URL, no trailing slash. */
  appUrl: string;
}

/**
 * Confirms a member-initiated account deactivation. Explains what happens to
 * their data and gives a clear window + path to reverse it.
 */
export function buildAccountDeactivationEmail({ email, firstName, reversalDays, appUrl }: Args): SendEmailPayload {
  const base = appUrl.replace(/\/$/, '');
  const loginUrl = `${base}/login`;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';

  const subject = 'Your Everlasting Hills account has been deactivated';

  const text = [
    greeting,
    '',
    'We have received your request to deactivate your Everlasting Hills member account. This has now been done.',
    '',
    'What this means:',
    '  • Your account is deactivated and no longer active.',
    `  • Your information is kept for ${reversalDays} days in case you change your mind.`,
    `  • You can reactivate any time within ${reversalDays} days simply by logging back in.`,
    `  • After ${reversalDays} days, your personal data may be permanently removed.`,
    '',
    `Changed your mind? Reactivate here: ${loginUrl}`,
    '',
    `If you did not request this, contact us immediately at ${CHURCH_INFO.email}.`,
    '',
    'You will always have a place here.',
    '— Everlasting Hills Church',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">We've received your request to deactivate your Everlasting Hills member account, and it's now done.</p>
    <div style="background:#FFF4F6;border:1px solid #E7CDD3;border-radius:12px;padding:16px 20px;margin:0 0 20px">
      <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:800;color:#87102C">What happens now</p>
      <ul style="margin:0;padding-left:18px;color:#4B5563;font-size:14px;line-height:1.7">
        <li>Your account is deactivated and no longer active.</li>
        <li>Your information is kept for <strong>${reversalDays} days</strong> in case you change your mind.</li>
        <li>You can reactivate any time within ${reversalDays} days by simply logging back in.</li>
        <li>After ${reversalDays} days, your personal data may be permanently removed.</li>
      </ul>
    </div>
    <p style="margin:0 0 8px">Changed your mind? You're always welcome back.</p>
    <p style="margin:0;color:#87102C"><strong>Didn't request this?</strong> Contact us right away at <a href="mailto:${CHURCH_INFO.email}" style="color:#87102C">${CHURCH_INFO.email}</a>.</p>
  `;

  const html = renderEmailLayout({
    heading: 'Your account has been deactivated',
    bodyHtml,
    cta: { label: 'Reactivate my account', href: loginUrl },
  });

  return { to: email, subject, text, html, tag: 'account-deactivation' };
}
