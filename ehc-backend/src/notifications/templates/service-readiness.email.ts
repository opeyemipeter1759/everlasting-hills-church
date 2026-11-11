import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

/** "Saturday 14 November, 7:45 am" in Lagos time. */
export function lagosWhen(at: Date): string {
  const day = at.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' });
  const time = at.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' }).toLowerCase();
  return `${day}, ${time}`;
}

const para = (text: string) => `<p style="margin:0 0 14px">${escapeHtml(text)}</p>`;
const list = (items: string[]) => `<ul style="margin:0 0 14px;padding-left:20px">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;

function email(
  to: string, subject: string, heading: string, lines: string[], cta: { label: string; href: string }, tag: string, items: string[] = [],
): SendEmailPayload {
  return {
    to,
    subject,
    text: [...lines, ...items.map((i) => `- ${i}`), '', `${cta.label}: ${cta.href}`, '', '— Everlasting Hills Church'].join('\n'),
    html: renderEmailLayout({ heading, bodyHtml: lines.map(para).join('') + (items.length ? list(items) : ''), cta }),
    tag,
  };
}

/** To a unit's leaders: their plan for a service isn't in yet. */
export function buildPlanReminderEmail(a: { to: string; unitName: string; day: string; planDue: Date; link: string }) {
  return email(
    a.to,
    `${a.unitName}: plan for ${a.day}'s service is due ${lagosWhen(a.planDue)}`,
    `Send ${a.unitName}'s plan`,
    [
      `${a.unitName} hasn't sent its plan for ${a.day}'s service yet.`,
      `It's due ${lagosWhen(a.planDue)}. List the tasks your unit needs to get done for the service, then send the plan.`,
    ],
    { label: 'Open my service plan', href: a.link },
    'readiness-plan-reminder',
  );
}

/** To a unit's leaders: the Administrator added tasks to their plan. */
export function buildTasksAddedEmail(a: { to: string; unitName: string; day: string; by: string; titles: string[]; link: string }) {
  const many = a.titles.length > 1;
  return email(
    a.to,
    `${a.by} added ${many ? `${a.titles.length} tasks` : 'a task'} to ${a.unitName}'s plan for ${a.day}`,
    `New task${many ? 's' : ''} for ${a.unitName}`,
    [`${a.by} added ${many ? 'these tasks' : 'this task'} to ${a.unitName}'s plan for ${a.day}'s service:`],
    { label: 'Open my service plan', href: a.link },
    'readiness-task-added',
    a.titles,
  );
}

/** To Admin, Admin Head, Super Admin and Pastor: a unit submitted (or re-sent) its plan. */
export function buildPlanSubmittedEmail(a: { to: string; unitName: string; day: string; by: string; changed: boolean; tasks: string[]; link: string }) {
  const verb = a.changed ? 're-sent' : 'sent';
  return email(
    a.to,
    `${a.unitName} ${verb} its plan for ${a.day}`,
    `${a.unitName}'s plan is in`,
    [`${a.by} ${verb} ${a.unitName}'s plan for ${a.day}'s service. It's waiting for your approval.`, ...(a.tasks.length ? ['Their tasks:'] : [])],
    { label: 'Review and approve', href: a.link },
    'readiness-plan-submitted',
    a.tasks,
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
