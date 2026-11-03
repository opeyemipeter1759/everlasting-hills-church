import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  fullName: string;
  /** Watches whose leader's three months are up, with who led them. */
  ended: { slotLabel: string; slotTime: string; leaderName: string }[];
  url: string;
}

/** Tells the Prayer Watch admins a leader's three months are up, so they can choose who leads next. */
export function buildPrayerWatchLeaderTermEndedEmail({ to, fullName, ended, url }: Args): SendEmailPayload {
  const one = ended.length === 1;
  const lines = ended.map((e) => `${e.slotLabel} (${e.slotTime}), led by ${e.leaderName}`);
  const intro = one
    ? `${ended[0].leaderName}’s three months leading the ${ended[0].slotLabel} are up.`
    : 'These watch leaders have finished their three months:';
  const ask = one
    ? 'When you get a moment, please choose who leads that watch next. You can keep the same person for another term or pass it to someone new. Either way, a quick thank-you to them would mean a lot.'
    : 'When you get a moment, please choose who leads each of these next. You can keep the same people for another term or pass it on. Either way, a quick thank-you to each of them would mean a lot.';

  const text = [
    greetingText(fullName),
    '',
    intro,
    ...(one ? [] : ['', ...lines.map((l) => `- ${l}`)]),
    '',
    ask,
    '',
    'Choosing a leader on the Prayer Watch page starts their three months and sends them a welcome email.',
    '',
    'Thank you,',
    'Everlasting Hills Church',
  ].join('\n');

  const bodyHtml = `
    ${greetingHtml(fullName)}
    <p style="margin:0 0 ${one ? 16 : 10}px">${escapeHtml(intro)}</p>
    ${one ? '' : `<ul style="margin:0 0 16px;padding-left:20px">${lines.map((l) => `<li style="margin:0 0 6px">${escapeHtml(l)}</li>`).join('')}</ul>`}
    <p style="margin:0 0 16px">${escapeHtml(ask)}</p>
    <p style="margin:0 0 16px">Choosing a leader on the Prayer Watch page starts their three months and sends them a welcome email.</p>
    <p style="margin:0">Thank you,<br>Everlasting Hills Church</p>
  `;

  return {
    to,
    subject: one ? `Time to choose the next leader for the ${ended[0].slotLabel}` : 'Time to choose the next Prayer Watch leaders',
    text,
    html: renderEmailLayout({ heading: one ? 'A leader’s term is up' : 'Leaders’ terms are up', bodyHtml, cta: { label: 'Choose the next leader', href: url } }),
    tag: 'prayer-watch-leader-term-ended',
  };
}
