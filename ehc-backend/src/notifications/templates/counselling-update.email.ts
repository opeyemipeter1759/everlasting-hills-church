import type { SendEmailPayload } from '../notification-events';
import { CHURCH_INFO } from '../church-info';
import {
  escapeHtml,
  greetingHtml,
  greetingText,
  renderEmailLayout,
} from './layout';

export type CounsellingEmailEvent =
  | 'RECEIVED'
  | 'INFO_REQUESTED'
  | 'STATUS_UPDATED'
  | 'COUNSELLOR_ASSIGNED'
  | 'SESSION_SCHEDULED'
  | 'SESSION_RESCHEDULED'
  | 'SESSION_CANCELLED'
  | 'SESSION_REMINDER'
  | 'COMPLETED';

/**
 * What each email says. Deliberately general: the greeting, what happened, the
 * time if there is one, and how to reach the church. Never what anyone wrote,
 * never the partner's details, never anything from a session.
 */
const COPY: Record<CounsellingEmailEvent, { subject: string; line: string }> = {
  RECEIVED: {
    subject: 'We have your pre-marital counselling application',
    line: 'Thank you for applying for pre-marital counselling with us. Your application is safely with the pastoral team, and someone will be in touch about next steps.',
  },
  INFO_REQUESTED: {
    subject: 'A quick question about your application',
    line: 'The pastoral team needs a little more information before they can take your application forward. Someone from the team will contact you shortly.',
  },
  STATUS_UPDATED: {
    subject: 'An update on your application',
    line: 'There is an update on your pre-marital counselling application. Someone from the pastoral team will be in touch about what happens next.',
  },
  COUNSELLOR_ASSIGNED: {
    subject: 'Your counsellor has been arranged',
    line: 'A counsellor from our marriage ministry has been arranged for you, and they will contact you to plan your first session.',
  },
  SESSION_SCHEDULED: {
    subject: 'Your counselling session is booked',
    line: 'Your next counselling session is booked.',
  },
  SESSION_RESCHEDULED: {
    subject: 'Your counselling session has moved',
    line: 'Your counselling session has moved to a new time.',
  },
  SESSION_CANCELLED: {
    subject: 'Your counselling session is cancelled',
    line: 'Your counselling session has been cancelled. Your counsellor will be in touch to find another time.',
  },
  SESSION_REMINDER: {
    subject: 'Your counselling session is coming up',
    line: 'A quick reminder that your counselling session is coming up.',
  },
  COMPLETED: {
    subject: 'You have completed pre-marital counselling',
    line: 'Congratulations on completing pre-marital counselling with us. We are praying for you both as you prepare for your marriage.',
  },
};

export const counsellingSubject = (event: CounsellingEmailEvent) =>
  COPY[event].subject;

export function buildCounsellingEmail(a: {
  firstName: string;
  email: string;
  event: CounsellingEmailEvent;
  /** "Tuesday, 1 December 2026 at 12:30 am", for session emails. */
  when?: string | null;
  appUrl: string;
}): SendEmailPayload {
  const { subject, line } = COPY[a.event];
  const site = a.appUrl.replace(/\/$/, '');
  const contactUrl = `${site}/contact`;
  const dashboard = { label: 'Open your dashboard', href: `${site}/login` };
  const text = [
    greetingText(a.firstName),
    '',
    line,
    ...(a.when ? ['', `When: ${a.when} (Lagos time)`] : []),
    '',
    `You can follow everything on your counselling dashboard: ${dashboard.href}`,
    '',
    `If you have any questions, call the church office on ${CHURCH_INFO.phone} or write to us at ${contactUrl}.`,
    '',
    'With love,',
    `The Pastoral Team, ${CHURCH_INFO.name}`,
  ].join('\n');
  const bodyHtml = [
    `<p>${greetingHtml(a.firstName)}</p>`,
    `<p>${escapeHtml(line)}</p>`,
    a.when
      ? `<p><strong>When:</strong> ${escapeHtml(a.when)} (Lagos time)</p>`
      : '',
    `<p>If you have any questions, call the church office on ${escapeHtml(CHURCH_INFO.phone)} or <a href="${contactUrl}" style="color:#87102C">write to us</a>.</p>`,
    `<p>With love,<br />The Pastoral Team, ${escapeHtml(CHURCH_INFO.name)}</p>`,
  ].join('');
  const html = renderEmailLayout({ heading: escapeHtml(subject), bodyHtml, cta: dashboard });
  return {
    to: a.email,
    subject,
    text,
    html,
    tag: `counselling-${a.event.toLowerCase().replace(/_/g, '-')}`,
    redactRecipient: true,
  };
}
