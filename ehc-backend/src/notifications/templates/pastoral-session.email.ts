import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  name: string;
  subject: string;
  heading: string;
  /** Plain sentences, one paragraph each. */
  paragraphs: string[];
  /** Label/value rows, e.g. When, Where. */
  details: [string, string][];
  /** A note written by the pastor or the requester, shown quoted. */
  quote?: { label: string; text: string } | null;
  cta: { label: string; href: string };
  tag: string;
}

/** Every One-on-One email: a greeting, a few sentences, the session details, one action. */
export function buildPastoralSessionEmail({ to, name, subject, heading, paragraphs, details, quote, cta, tag }: Args): SendEmailPayload {
  const text = [
    greetingText(name),
    '',
    ...paragraphs.flatMap((p) => [p, '']),
    ...details.map(([label, value]) => `${label}: ${value}`),
    ...(quote ? ['', `${quote.label}:`, quote.text] : []),
    '',
    `${cta.label}: ${cta.href}`,
  ].join('\n');

  const rows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#7A6A6F;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  const bodyHtml = `
    ${greetingHtml(name)}
    ${paragraphs.map((p) => `<p style="margin:0 0 16px">${escapeHtml(p)}</p>`).join('')}
    <table role="presentation" style="margin:0 0 16px;border-collapse:collapse;font-size:15px">${rows}</table>
    ${
      quote
        ? `<p style="margin:0 0 6px;color:#7A6A6F;font-size:13px">${escapeHtml(quote.label)}</p><blockquote style="margin:0 0 16px;padding:10px 14px;border-left:3px solid #87102C;background:#FDF3F5">${escapeHtml(quote.text)}</blockquote>`
        : ''
    }
  `;

  return { to, subject, text, html: renderEmailLayout({ heading, bodyHtml, cta }), tag };
}
