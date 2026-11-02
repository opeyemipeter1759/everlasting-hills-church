import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  fullName: string;
  slotLabel: string;
  slotTime: string;
  /** The watch family's WhatsApp group, where the meeting and the rota happen. */
  whatsappLink?: string | null;
  url: string;
}

/** Sent the moment an admin names someone leader of their Prayer Watch slot: what leading the family actually involves, starting this week. */
export function buildPrayerWatchLeaderAssignedEmail({ to, fullName, slotLabel, slotTime, whatsappLink, url }: Args): SendEmailPayload {
  const steps = [
    'Call a short meeting with the family this week, on a WhatsApp call or in person, whichever is easier for everyone.',
    'Together, agree who leads prayer on each night, Monday to Saturday. You can take some nights yourself, but share it out so no one carries every night alone.',
    'Post the rota in the family’s WhatsApp group so everyone knows who is leading when.',
  ];

  const text = [
    greetingText(fullName),
    '',
    `We’d love you to lead the ${slotLabel} (${slotTime}) on the Prayer Watch. Thank you for saying yes.`,
    '',
    `You’ll be looking after the ${slotLabel} family, the people who pray that hour with you every night. Here’s how to get started:`,
    '',
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    'After that, it’s mostly about keeping the family together: check in on anyone who has gone quiet, and step in or find someone when a night’s leader can’t make it.',
    '',
    'If you have any questions, talk to the Prayer Watch admin or the church office.',
    '',
    'God bless you,',
    'Everlasting Hills Church',
    ...(whatsappLink ? ['', `Family WhatsApp group: ${whatsappLink}`] : []),
  ].join('\n');

  const bodyHtml = `
    ${greetingHtml(fullName)}
    <p style="margin:0 0 16px">We’d love you to lead the <strong>${escapeHtml(slotLabel)}</strong> (${escapeHtml(slotTime)}) on the Prayer Watch. Thank you for saying yes.</p>
    <p style="margin:0 0 12px">You’ll be looking after the ${escapeHtml(slotLabel)} family, the people who pray that hour with you every night. Here’s how to get started:</p>
    <ol style="margin:0 0 16px;padding-left:20px">
      ${steps.map((s) => `<li style="margin:0 0 8px">${escapeHtml(s)}</li>`).join('')}
    </ol>
    <p style="margin:0 0 16px">After that, it’s mostly about keeping the family together: check in on anyone who has gone quiet, and step in or find someone when a night’s leader can’t make it.</p>
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
