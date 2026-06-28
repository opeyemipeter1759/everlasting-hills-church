import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  firstName: string;
  email: string;
}

/**
 * Happy-birthday greeting to a member. Sent by the daily scheduled task to
 * everyone whose birthday falls today.
 */
export function buildBirthdayEmail(args: Args): SendEmailPayload {
  const { firstName, email } = args;

  const subject = `Happy birthday, ${firstName}!`;

  const text = [
    `Happy birthday, ${firstName}!`,
    '',
    'The whole Everlasting Hills family is celebrating you today. We thank God for your life and the gift you are to this house.',
    '',
    'May this new year of your life overflow with His goodness, unto the utmost bound of the everlasting hills.',
    '',
    'With love,',
    '— Everlasting Hills Church · Ibadan',
  ].join('\n');

  const html = renderEmailLayout({
    heading: `Happy birthday, ${escapeHtml(firstName)}! 🎉`,
    bodyHtml: `
      <p style="margin:0 0 16px">The whole Everlasting Hills family is celebrating you today. We thank God for your life and the gift you are to this house.</p>
      <p style="margin:0">May this new year of your life overflow with His goodness, unto the utmost bound of the everlasting hills.</p>
    `,
  });

  return { to: email, subject, text, html, tag: 'birthday' };
}
