import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  firstName: string;
  email: string;
  /** Years since the milestone, when known (e.g. wedding or membership years). */
  years?: number;
  /** What is being celebrated. Defaults to a general anniversary. */
  occasion?: string;
}

/**
 * Anniversary greeting (wedding, membership, or other milestone). Sent by the
 * daily scheduled task to members whose anniversary falls today.
 */
export function buildAnniversaryEmail(args: Args): SendEmailPayload {
  const { firstName, email, years, occasion = 'anniversary' } = args;

  const yearsText = years ? ` ${years}-year` : '';
  const subject = `Happy ${occasion}, ${firstName}!`;

  const text = [
    `Happy ${occasion}, ${firstName}!`,
    '',
    `On your${yearsText} ${occasion}, the Everlasting Hills family rejoices with you and gives thanks to God for His faithfulness.`,
    '',
    'May He continue to crown your days with grace, love, and abundant blessing.',
    '',
    'With love,',
    '— Everlasting Hills Church · Ibadan',
  ].join('\n');

  const html = renderEmailLayout({
    heading: `Happy ${escapeHtml(occasion)}, ${escapeHtml(firstName)}! 💍`,
    bodyHtml: `
      <p style="margin:0 0 16px">On your${escapeHtml(yearsText)} ${escapeHtml(occasion)}, the Everlasting Hills family rejoices with you and gives thanks to God for His faithfulness.</p>
      <p style="margin:0">May He continue to crown your days with grace, love, and abundant blessing.</p>
    `,
  });

  return { to: email, subject, text, html, tag: 'anniversary' };
}
