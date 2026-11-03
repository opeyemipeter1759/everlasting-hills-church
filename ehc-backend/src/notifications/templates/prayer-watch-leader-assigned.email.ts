import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  fullName: string;
  slotLabel: string;
  slotTime: string;
  /** The watch family's WhatsApp group, where the meeting and the rota happen. */
  whatsappLink?: string | null;
  /** "February 2027": when this three-month term ends. */
  termEndsMonth: string;
  url: string;
}

/** Sent the moment an admin names someone leader of their Prayer Watch slot: what leading the family actually involves, starting this week. */
export function buildPrayerWatchLeaderAssignedEmail({ to, fullName, slotLabel, slotTime, whatsappLink, termEndsMonth, url }: Args): SendEmailPayload {
  const term = `Leaders serve for three months, so your term runs until ${termEndsMonth}. Near the end, the Prayer Watch admins will be in touch about who leads next.`;
  const steps = [
    'Call a short meeting with the family this week, on a WhatsApp call or in person, whichever is easier for everyone.',
    'Together, agree who leads prayer on each night, Monday to Saturday. You can take some nights yourself, but share it out so no one carries every night alone.',
    'Post the rota in the family’s WhatsApp group so everyone knows who is leading when.',
  ];
  const family = [
    'Most of all, help this group become a real family. Celebrate each other: birthdays, new jobs, answered prayers, the small wins too. And when someone is going through something hard, don’t let them carry it alone. Pray for them by name, check on them, and let the family stand with them.',
    'Keep an eye out for anyone who has gone quiet, and when a night’s leader can’t make it, step in or find someone who can.',
  ];

  const text = [
    greetingText(fullName),
    '',
    `We’d love you to lead the ${slotLabel} (${slotTime}) on the Prayer Watch. Thank you for saying yes.`,
    '',
    term,
    '',
    `You’ll be looking after the ${slotLabel} family, the people who pray that hour with you every night. Here’s how to get started:`,
    '',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    ...family.flatMap((p) => [p, '']),
    'If you have any questions, talk to the Prayer Watch admin or the church office.',
    '',
    'God bless you,',
    'Everlasting Hills Church',
    ...(whatsappLink ? ['', `Family WhatsApp group: ${whatsappLink}`] : []),
  ].join('\n');

  const bodyHtml = `
    ${greetingHtml(fullName)}
    <p style="margin:0 0 16px">We’d love you to lead the <strong>${escapeHtml(slotLabel)}</strong> (${escapeHtml(slotTime)}) on the Prayer Watch. Thank you for saying yes.</p>
    <p style="margin:0 0 16px">${escapeHtml(term)}</p>
    <p style="margin:0 0 12px">You’ll be looking after the ${escapeHtml(slotLabel)} family, the people who pray that hour with you every night. Here’s how to get started:</p>
    <ol style="margin:0 0 16px;padding-left:20px">
      ${steps.map((s) => `<li style="margin:0 0 8px">${escapeHtml(s)}</li>`).join('')}
    </ol>
    ${family.map((p) => `<p style="margin:0 0 16px">${escapeHtml(p)}</p>`).join('')}
    <p style="margin:0 0 16px">If you have any questions, talk to the Prayer Watch admin or the church office.</p>
    <p style="margin:0">God bless you,<br>Everlasting Hills Church</p>
  `;

  return {
    to,
    subject: `You’re leading the ${slotLabel} (${slotTime})`,
    text,
    html: renderEmailLayout({
      heading: `You’re leading the ${escapeHtml(slotLabel)}`,
      bodyHtml,
      cta: whatsappLink ? { label: 'Open the family WhatsApp group', href: whatsappLink } : { label: 'Open the Prayer Watch', href: url },
    }),
    tag: 'prayer-watch-leader-assigned',
  };
}
