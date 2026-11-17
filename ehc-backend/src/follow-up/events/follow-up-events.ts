import { Prisma, Role } from '@prisma/client';
import type { OutboxEventDefinition } from '../../outbox/outbox.types';
import { decidersForUnit, departmentHeadsOf, roleHolders } from '../approvals/approval-deciders';

type Db = Prisma.TransactionClient;

/** The follow-up events the outbox carries. A new workflow is one more entry here and one more definition below. */
export const FollowUpEvent = {
  Registered: 'first_timer.registered',
  Assigned: 'first_timer.assigned',
  ApprovalRequested: 'approval.requested',
  ApprovalDecided: 'approval.decided',
} as const;

/**
 * Payloads are snapshots kept on every notification row, so they hold ids, a
 * first name and the action. Never a surname, a note or a form answer.
 */
export interface RegisteredPayload {
  visitorId: string;
  firstName: string;
}

export interface AssignedPayload {
  /** Member id of the new assignee. */
  assigneeMemberId: string;
  /** One first-timer: who, and the entry, so a stale event tells nobody. */
  visitorId?: string;
  firstName?: string;
  entryId?: string;
  /** Several at once (bulk reassign): how many, and the unit to open. */
  count?: number;
  unitId?: string;
}

export interface ApprovalRequestedPayload {
  approvalId: string;
  kind: string;
  visitorId: string;
  firstName: string;
  unitId: string;
  /** Profile id. */
  requesterId: string;
}

export interface ApprovalDecidedPayload extends ApprovalRequestedPayload {
  decision: 'APPROVED' | 'CHANGES_REQUESTED';
  adminOverride: boolean;
}

/** Lock-screen safe: the first word of a first name, so a full name typed into one box still shows only the first. */
export function safeFirstName(firstName: string | null | undefined): string {
  return (firstName ?? '').trim().split(/\s+/)[0] || 'A first-timer';
}

export const profileLink = (visitorId: string) => `/dashboard/follow-up/person/${visitorId}`;

/** Pastor and admin role holders: told about every decision. */
export const DECISION_WATCHERS: Role[] = [Role.PASTOR, Role.ADMIN, Role.ADMIN_HEAD, Role.SUPER_ADMIN];

/** The profile of a first-timer's current assignee, through their form or the account made from it. */
async function currentAssigneeProfile(db: Db, tenantId: string, visitorId: string): Promise<string | null> {
  const visitor = await db.visitor.findFirst({ where: { id: visitorId, tenantId }, select: { convertedToMemberId: true } });
  if (!visitor) return null;
  const entry = await db.followUpEntry.findFirst({
    where: { tenantId, OR: [{ visitorId }, ...(visitor.convertedToMemberId ? [{ memberId: visitor.convertedToMemberId }] : [])] },
    orderBy: { updatedAt: 'desc' },
    select: { Assignee: { select: { profileId: true } } },
  });
  return entry?.Assignee?.profileId ?? null;
}

/** Each definition resolves its recipients from the assignment rows as they stand when it is dispatched. */
export function followUpEventDefinitions(db: Db) {
  const registered: OutboxEventDefinition<RegisteredPayload> = {
    type: FollowUpEvent.Registered,
    recipients: async (_p, tenantId) => {
      const contacts = await db.firstTimerContactAssignment.findMany({ where: { tenantId, endedAt: null }, select: { userId: true } });
      return contacts.map((c) => c.userId);
    },
    message: (p) => ({
      title: 'New first-timer',
      body: `${safeFirstName(p.firstName)} just registered. Send them the opening message.`,
      link: profileLink(p.visitorId),
    }),
    push: { category: 'followUpUpdates' },
  };

  const assigned: OutboxEventDefinition<AssignedPayload> = {
    type: FollowUpEvent.Assigned,
    recipients: async (p, tenantId) => {
      const member = await db.member.findFirst({ where: { id: p.assigneeMemberId, tenantId }, select: { profileId: true } });
      if (!member) return [];
      if (p.entryId) {
        // Reassigned again before this went out: the new event tells the new person.
        const entry = await db.followUpEntry.findFirst({ where: { id: p.entryId, tenantId }, select: { assigneeId: true } });
        if (entry?.assigneeId !== p.assigneeMemberId) return [];
      }
      return [member.profileId];
    },
    message: (p) =>
      p.count && p.count > 1
        ? {
            title: 'First-timers for you',
            body: `${p.count} first-timers are now yours to follow up.`,
            link: p.unitId ? `/dashboard/membership-assimilation/${p.unitId}` : '/dashboard',
          }
        : {
            title: 'A first-timer for you',
            body: `${safeFirstName(p.firstName)} is yours to follow up. Open their profile to start.`,
            link: p.visitorId ? profileLink(p.visitorId) : '/dashboard',
          },
    push: { category: 'followUpUpdates' },
  };

  const requested: OutboxEventDefinition<ApprovalRequestedPayload> = {
    type: FollowUpEvent.ApprovalRequested,
    recipients: async (p, tenantId) => {
      const request = await db.approvalRequest.findFirst({ where: { id: p.approvalId, tenantId }, select: { status: true, unitId: true } });
      if (request?.status !== 'PENDING') return [];
      return (await decidersForUnit(db, tenantId, request.unitId)).profileIds;
    },
    message: (p) => ({
      title: 'Approval needed',
      body: `${safeFirstName(p.firstName)} is ready to be integrated. Open to approve or ask for changes.`,
      link: profileLink(p.visitorId),
    }),
    push: { category: 'followUpUpdates' },
  };

  // Informational for most of its recipients, so in-app only: the bell carries it.
  const decided: OutboxEventDefinition<ApprovalDecidedPayload> = {
    type: FollowUpEvent.ApprovalDecided,
    recipients: async (p, tenantId) => {
      const [watchers, heads, assignee] = await Promise.all([
        roleHolders(db, tenantId, DECISION_WATCHERS),
        departmentHeadsOf(db, tenantId, p.unitId),
        currentAssigneeProfile(db, tenantId, p.visitorId),
      ]);
      return [...watchers, ...heads, ...(assignee ? [assignee] : []), p.requesterId];
    },
    message: (p) => {
      const name = safeFirstName(p.firstName);
      return p.decision === 'APPROVED'
        ? { title: 'Integration approved', body: `${name} is now integrated.`, link: profileLink(p.visitorId) }
        : { title: 'Changes requested', body: `${name} needs a little more follow-up first. Open to see what to do next.`, link: profileLink(p.visitorId) };
    },
  };

  return { registered, assigned, requested, decided };
}
