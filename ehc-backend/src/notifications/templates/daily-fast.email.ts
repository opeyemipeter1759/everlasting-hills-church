import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingName, renderEmailLayout } from './layout';

export interface SessionRecap {
  title: string;
  /** Null when YouTube hasn't processed the recording yet — the email links to it instead. */
  recap: { title: string; summary: string; keyPoints: string[] } | null;
  url: string;
}

export interface DailyFastDay {
  /** e.g. "Furnace '26" */
  fastName: string;
  theme: string | null;
  dateLabel: string;
  dayNumber: number;
  totalDays: number;
  kind: 'meal' | 'dry';
  mealTime: string;
  dryDay?: number;
  dryLength?: number;
  breakTime?: string;
  lastMealBefore?: { days: number };
  isFirst: boolean;
  isLast: boolean;
  morning: string | null;
  evening: string | null;
  liveUrl: string;
}

interface Args {
  to: string;
  firstName: string | null;
  day: DailyFastDay;
  yesterday: SessionRecap[];
  imageUrl: string | null;
  unsubscribe: { page: string; oneClick: string };
  eventUrl: string;
}

/** The headline for the day — also the subject line. */
export function fastHeadline(d: DailyFastDay): string {
  if (d.kind === 'dry' && d.breakTime) return `break your fast at ${d.breakTime}`;
  if (d.kind === 'dry') return `dry fast, day ${d.dryDay} of ${d.dryLength}`;
  if (d.lastMealBefore) return `one meal at ${d.mealTime}, then the dry fast begins`;
  return `one meal today, from ${d.mealTime}`;
}

function fastLines(d: DailyFastDay): string[] {
  if (d.kind === 'dry' && d.breakTime) {
    return [
      `Dry fast, day ${d.dryDay} of ${d.dryLength}. Break your fast today at ${d.breakTime}.`,
      'Start with water, then something light such as pap, fruit or a light soup.',
    ];
  }
  if (d.kind === 'dry') return [`Dry fast, day ${d.dryDay} of ${d.dryLength}: no food or water today.`];
  const lines = [
    `One meal today, from ${d.mealTime}.`,
    // Tomorrow is a dry day before a dry fast, so there's no "until tomorrow's meal".
    `Eat once, and that is your meal for the day${d.lastMealBefore ? '' : `: nothing else until ${d.mealTime} tomorrow`}. No snacks, no second plate, and no splitting your meal into portions to eat later.`,
  ];
  if (d.lastMealBefore) {
    lines.push(
      `This is your last meal before the ${d.lastMealBefore.days}-day dry fast that begins tomorrow. Drink well and eat a light, nourishing meal.`,
    );
  } else {
    lines.push('Water is allowed throughout the day.');
  }
  return lines;
}

/**
 * The 5am email during a church fast: today's fast and when to break it, when
 * prayer meets, and a recap of yesterday's sessions. Goes to everyone on the
 * church's list (members and visitors), so it carries an unsubscribe link and
 * the one-click List-Unsubscribe header bulk mail needs.
 */
export function buildDailyFastEmail({ to, firstName, day: d, yesterday, imageUrl, unsubscribe, eventUrl }: Args): SendEmailPayload {
  const name = greetingName(firstName);
  const hello = name ? `Good morning ${name},` : 'Good morning,';
  const fullName = d.theme ? `${d.fastName}: ${d.theme}` : d.fastName;
  const opening = d.isFirst
    ? `Today we begin ${d.totalDays} days of fasting and prayer, ${fullName}. Here is how today goes.`
    : d.isLast
      ? `Today is the last day of ${fullName}. Thank you for pressing in with us.`
      : `Here is today in ${fullName}.`;
  const sessions = [
    d.morning ? `Morning: ${d.morning}` : 'Morning: no session today',
    d.evening ? `Evening: ${d.evening}` : 'Evening: no session today',
  ];
  const subject = `${d.fastName} · Day ${d.dayNumber} of ${d.totalDays}: ${fastHeadline(d)}`;

  const text = [
    hello,
    '',
    opening,
    '',
    `TODAY · Day ${d.dayNumber} of ${d.totalDays} · ${d.dateLabel}`,
    ...fastLines(d),
    '',
    'PRAYER',
    ...sessions,
    `Join live on YouTube: ${d.liveUrl}`,
    ...(yesterday.length
      ? [
          '',
          "YESTERDAY'S SESSIONS",
          ...yesterday.flatMap((s) =>
            s.recap
              ? ['', s.recap.title, s.recap.summary, ...s.recap.keyPoints.map((k) => `• ${k}`), `Watch: ${s.url}`]
              : ['', s.title, `The recording is still being prepared. Watch it here: ${s.url}`],
          ),
        ]
      : []),
    '',
    `The full fasting schedule: ${eventUrl}`,
    '',
    'Everlasting Hills Church',
    '',
    `Stop these daily emails: ${unsubscribe.page}`,
  ].join('\n');

  const p = (html: string, style = 'margin:0 0 12px') => `<p style="${style}">${html}</p>`;
  const recapHtml = yesterday
    .map((s) =>
      s.recap
        ? `<div style="margin:0 0 18px;padding:16px;border:1px solid #F1D5DB;border-radius:10px">
            <p style="margin:0 0 6px;font-weight:700;color:#111827">${escapeHtml(s.recap.title)}</p>
            <p style="margin:0 0 8px;color:#374151">${escapeHtml(s.recap.summary)}</p>
            ${s.recap.keyPoints.length ? `<ul style="margin:0 0 8px;padding-left:18px;color:#374151">${s.recap.keyPoints.map((k) => `<li style="margin:0 0 4px">${escapeHtml(k)}</li>`).join('')}</ul>` : ''}
            <a href="${escapeHtml(s.url)}" style="color:#87102C;font-weight:700">Watch the replay</a>
          </div>`
        : `<div style="margin:0 0 18px;padding:16px;border:1px solid #F1D5DB;border-radius:10px">
            <p style="margin:0 0 6px;font-weight:700;color:#111827">${escapeHtml(s.title)}</p>
            <p style="margin:0;color:#374151">The recording is still being prepared. <a href="${escapeHtml(s.url)}" style="color:#87102C;font-weight:700">Watch it here</a>.</p>
          </div>`,
    )
    .join('');

  const bodyHtml = `
    ${p(escapeHtml(hello))}
    ${p(escapeHtml(opening), 'margin:0 0 20px')}
    <div style="margin:0 0 20px;padding:18px;border-radius:12px;background:${d.kind === 'dry' ? '#3B0A0F' : '#FFF4F6'};color:${d.kind === 'dry' ? '#FFFFFF' : '#111827'}">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.75">Today · Day ${d.dayNumber} of ${d.totalDays} · ${escapeHtml(d.dateLabel)}</p>
      ${fastLines(d)
        .map((l, i) => `<p style="margin:${i === 0 ? '6px' : '0'} 0 6px;${i === 0 ? 'font-size:18px;font-weight:700' : ''}">${escapeHtml(l)}</p>`)
        .join('')}
    </div>
    <p style="margin:0 0 6px;font-weight:700">Prayer</p>
    ${sessions.map((s) => p(escapeHtml(s), 'margin:0 0 4px')).join('')}
    ${p(`<a href="${escapeHtml(d.liveUrl)}" style="color:#87102C;font-weight:700">Join live on YouTube</a>`, 'margin:6px 0 22px')}
    ${yesterday.length ? `<p style="margin:0 0 10px;font-weight:700">Yesterday&rsquo;s sessions</p>${recapHtml}` : ''}
    <p style="margin:18px 0 0;color:#6B7280;font-size:12px">You&rsquo;re receiving this because you&rsquo;re part of the Everlasting Hills Church family. <a href="${escapeHtml(unsubscribe.page)}" style="color:#6B7280">Stop these daily emails</a>.</p>
  `;

  return {
    to,
    subject,
    text,
    html: renderEmailLayout({
      heading: `Day ${d.dayNumber} of ${d.totalDays}`,
      bodyHtml,
      cta: { label: 'See the full fasting schedule', href: eventUrl },
    }),
    ...(imageUrl && { attachments: [{ filename: `${d.fastName.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')}.jpg`, url: imageUrl }] }),
    headers: {
      'List-Unsubscribe': `<${unsubscribe.oneClick}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    tag: 'daily-fast',
  };
}
