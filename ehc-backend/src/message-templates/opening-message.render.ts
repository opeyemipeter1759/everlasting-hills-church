import { CHURCH_INFO } from '../notifications/church-info';
import type { SendEmailPayload } from '../notifications/notification-events';
import { escapeHtml, greetingName, renderEmailLayout } from '../notifications/templates/layout';
import { normalizeNigerianPhone } from '../common/phone.util';
import { renderTemplate, WHATSAPP_MAX, type TemplateValues } from './template-variables';

/** The parts of a template version a render needs. */
export interface TemplateContent {
  version: number;
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
}

/** Who a message is from: the sender's own name and phone at send time. */
export interface Sender {
  name: string | null;
  phone: string | null;
}

/** "Sundays at 9:00 AM and Wednesdays at 5:30 PM", from the church's own service list. */
export function serviceTimesText(): string {
  const times = CHURCH_INFO.services.map((s) => s.time.trim().replace(/\s*·\s*/, ' at '));
  if (times.length <= 1) return times.join('');
  return `${times.slice(0, -1).join(', ')} and ${times[times.length - 1]}`;
}

export function churchValues(): Pick<TemplateValues, 'churchName' | 'serviceTimes'> {
  return { churchName: CHURCH_INFO.name, serviceTimes: serviceTimesText() };
}

/** A Nigerian mobile as people write it, "0803 123 4567"; anything else as stored. */
export function displayPhone(raw: string | null | undefined): string | null {
  const normalized = normalizeNigerianPhone(raw);
  if (!normalized) return null;
  if (!/^234\d{10}$/.test(normalized)) return normalized;
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/**
 * Every value for one first-timer and one sender. With no sender name the
 * message is signed by the welcome team; with no sender phone it gives the
 * church's number, so a message never goes out with a blank.
 */
export function valuesFor(firstName: string | null | undefined, sender: Sender): TemplateValues {
  return {
    firstName: greetingName(firstName) ?? 'there',
    ...churchValues(),
    contactName: sender.name?.trim() || 'the welcome team',
    contactPhone: displayPhone(sender.phone) ?? CHURCH_INFO.phone,
  };
}

/** The WhatsApp text, never longer than the cap (a save already guarantees it; this is the last guard). */
export function renderWhatsApp(content: Pick<TemplateContent, 'whatsappBody'>, values: TemplateValues): string {
  return renderTemplate(content.whatsappBody, values).trim().slice(0, WHATSAPP_MAX);
}

/** https://wa.me/234...?text=..., or null when there is no number to open. */
export function waMeLink(phone: string | null | undefined, text: string): string | null {
  const normalized = normalizeNigerianPhone(phone);
  const digits = normalized?.replace(/\D/g, '') ?? '';
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Plain text to email HTML: blank lines make paragraphs, single line breaks stay. */
function paragraphsHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

/** The opening email in the church's email layout, ready for the mail path. */
export function renderOpeningEmail(args: {
  content: Pick<TemplateContent, 'emailSubject' | 'emailBody'>;
  values: TemplateValues;
  to: string;
  appUrl: string;
  tag?: string;
}): SendEmailPayload {
  const subject = renderTemplate(args.content.emailSubject, args.values).replace(/\s+/g, ' ').trim();
  const text = renderTemplate(args.content.emailBody, args.values).trim();
  const base = args.appUrl.replace(/\/$/, '');
  const html = renderEmailLayout({
    bodyHtml: paragraphsHtml(text),
    cta: { label: 'Plan your next visit', href: `${base}/visit` },
  });
  return { to: args.to, subject, text, html, tag: args.tag ?? 'first-timer-opening' };
}
