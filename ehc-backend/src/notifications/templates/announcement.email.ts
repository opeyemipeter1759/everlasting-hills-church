import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  email: string;
  title: string;
  body: string;
}

/**
 * Email form of a church announcement. Body text is plain (multi-paragraph),
 * rendered with simple line breaks.
 */
export function buildAnnouncementEmail({ email, title, body }: Args): SendEmailPayload {
  const text = [title, '', body, '', '— Everlasting Hills Church · Ibadan'].join('\n');

  const bodyHtml = escapeHtml(body)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const html = renderEmailLayout({
    heading: escapeHtml(title),
    bodyHtml,
  });

  return { to: email, subject: title, text, html, tag: 'announcement' };
}
