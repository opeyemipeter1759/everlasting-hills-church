import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  donorName?: string | null;
  email: string;
  /** Amount in major units (Naira), already divided from kobo. */
  amount: number;
  currency: string;
  reference: string;
  category?: string | null;
  date: Date;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/**
 * Receipt sent after a successful Paystack giving transaction. Confirms the
 * gift, restates the amount + reference for the donor's records, and thanks
 * them. Sent on verify and on the charge.success webhook (idempotent upstream).
 */
export function buildGivingReceiptEmail(args: Args): SendEmailPayload {
  const { donorName, email, amount, currency, reference, category, date } = args;
  const name = donorName?.trim() || 'Friend';
  const money = formatMoney(amount, currency);
  const when = date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Your gift to Everlasting Hills — receipt (${reference})`;

  const text = [
    `Dear ${name},`,
    '',
    `Thank you for your generous gift of ${money}. It has been received with gratitude.`,
    '',
    `  Amount:    ${money}`,
    `  Purpose:   ${category ?? 'General'}`,
    `  Reference: ${reference}`,
    `  Date:      ${when}`,
    '',
    'May the Lord, who loves a cheerful giver, bless you abundantly, unto the utmost bound of the everlasting hills.',
    '',
    'With gratitude,',
    '— Everlasting Hills Church · Ibadan',
  ].join('\n');

  const html = renderEmailLayout({
    heading: `Thank you for your gift, ${escapeHtml(name)}.`,
    bodyHtml: `
      <p style="margin:0 0 16px">Your generous gift of <strong>${escapeHtml(money)}</strong> has been received with gratitude.</p>
      <div style="background:#FFF;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin:0 0 20px">
        <p style="margin:0 0 8px;font-size:14px;color:#111"><strong>Amount:</strong> ${escapeHtml(money)}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#111"><strong>Purpose:</strong> ${escapeHtml(category ?? 'General')}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#111"><strong>Reference:</strong> ${escapeHtml(reference)}</p>
        <p style="margin:0;font-size:14px;color:#111"><strong>Date:</strong> ${escapeHtml(when)}</p>
      </div>
      <p style="margin:0">May the Lord, who loves a cheerful giver, bless you abundantly.</p>
    `,
  });

  return { to: email, subject, text, html, tag: 'giving-receipt' };
}
