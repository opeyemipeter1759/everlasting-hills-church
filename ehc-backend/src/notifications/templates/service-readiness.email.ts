import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

/** "Saturday 14 November, 7:45 am" in Lagos time. */
export function lagosWhen(at: Date): string {
  const day = at.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' });
  const time = at.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' }).toLowerCase();
  return `${day}, ${time}`;
}

const para = (text: string) => `<p style="margin:0 0 14px">${escapeHtml(text)}</p>`;

function email(to: string, subject: string, heading: string, lines: string[], cta: { label: string; href: string }, tag: string): SendEmailPayload {
  return {
    to,
    subject,
    text: [...lines, '', `${cta.label}: ${cta.href}`, '', '— Everlasting Hills Church'].join('\n'),
    html: renderEmailLayout({ heading, bodyHtml: lines.map(para).join(''), cta }),
    tag,
  };
}

/** To a unit's leaders: their plan for a service isn't in yet. */
export function buildPlanReminderEmail(a: { to: string; unitName: string; day: string; planDue: Date; link: string }) {
  return email(
    a.to,
    `${a.unitName}: plan for ${a.day}'s service is due ${lagosWhen(a.planDue)}`,
    `Submit ${a.unitName}'s plan`,
    [
      `${a.unitName} hasn't submitted its plan for ${a.day}'s service yet.`,
      `It's due ${lagosWhen(a.planDue)}: who is serving, the equipment you need, what's done and anything outstanding.`,
    ],
    { label: 'Submit the plan', href: a.link },
    'readiness-plan-reminder',
  );
}

/** To Admin, Admin Head, Super Admin and Pastor: a unit submitted (or changed) its plan. */
export function buildPlanSubmittedEmail(a: { to: string; unitName: string; day: string; by: string; changed: boolean; needs: string | null; link: string }) {
  return email(
    a.to,
    `${a.unitName} ${a.changed ? 'updated' : 'submitted'} its plan for ${a.day}`,
    `${a.unitName}'s plan is ${a.changed ? 'updated' : 'in'}`,
    [
      `${a.by} ${a.changed ? 'updated' : 'submitted'} ${a.unitName}'s plan for ${a.day}'s service. It's waiting for your approval.`,
      ...(a.needs ? [`They need: ${a.needs}`] : []),
    ],
    { label: 'Review and approve', href: a.link },
    'readiness-plan-submitted',
  );
}

/** To Admin, Admin Head, Super Admin and Pastor: a unit reported it is ready, or blocked. */
export function buildStatusUpdateEmail(a: { to: string; unitName: string; day: string; by: string; blocked: boolean; note: string | null; link: string }) {
  return email(
    a.to,
    a.blocked ? `Blocker: ${a.unitName} for ${a.day}` : `${a.unitName} is ready for ${a.day}`,
    a.blocked ? `${a.unitName} has a blocker` : `${a.unitName} is ready`,
    [
      a.blocked
        ? `${a.by} reported a blocker for ${a.unitName} ahead of ${a.day}'s service.`
        : `${a.by} confirmed everything is ready for ${a.unitName} ahead of ${a.day}'s service.`,
      ...(a.note ? [a.blocked ? `What's wrong: ${a.note}` : `Note: ${a.note}`] : []),
    ],
    { label: 'Open the readiness board', href: a.link },
    a.blocked ? 'readiness-blocker' : 'readiness-ready',
  );
}
