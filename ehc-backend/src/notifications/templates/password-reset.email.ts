import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';
import { CHURCH_INFO } from '../church-info';

interface Args {
  email: string;
  /** The one-time link to the change-password page. */
  link: string;
  /** 'reset' after "Forgot password"; 'setup' for a new account choosing its first password. */
  purpose: 'reset' | 'setup';
}

const COPY = {
  reset: {
    subject: 'Reset your Everlasting Hills password',
    heading: 'Reset your password',
    intro: 'We received a request to reset the password for your Everlasting Hills member account.',
    button: 'Reset password',
    ignore: "If you didn't ask for this, you can ignore this email — your password won't change.",
  },
  setup: {
    subject: 'Set up your Everlasting Hills account',
    heading: 'Choose your password',
    intro: 'An Everlasting Hills member account has been created for you. Choose a password to start using it.',
    button: 'Choose my password',
    ignore: `If you weren't expecting this, let us know at ${CHURCH_INFO.email}.`,
  },
} as const;

/**
 * The password reset / account setup email. Sent by the app rather than by
 * Supabase so the link always opens the live site: Supabase's own email sends
 * people to its configured Site URL, which can't be relied on.
 */
export function buildPasswordResetEmail({ email, link, purpose }: Args): SendEmailPayload {
  const copy = COPY[purpose];
  const text = [
    'Hi,',
    '',
    copy.intro,
    '',
    `${copy.button}: ${link}`,
    '',
    'This link works once and expires in 1 hour.',
    copy.ignore,
    '',
    '— Everlasting Hills Church',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">${escapeHtml(copy.intro)}</p>
    <p style="margin:0 0 16px">Use the button below. It works once and expires in 1 hour.</p>
    <p style="margin:0;color:#6B7280;font-size:10pt">${escapeHtml(copy.ignore)}</p>
  `;

  return {
    to: email,
    subject: copy.subject,
    text,
    html: renderEmailLayout({ heading: copy.heading, bodyHtml, cta: { label: copy.button, href: link } }),
    tag: purpose === 'reset' ? 'password-reset' : 'password-setup',
  };
}
