import { Prisma } from '@prisma/client';
import { memberStatusFor, personName } from './master-list.util';
import type { FollowUpPerson } from './follow-up-person.types';

const latestAssignee = {
  orderBy: { createdAt: 'desc' },
  take: 1,
  include: { Assignee: { select: { id: true, firstName: true, lastName: true } } },
} as const;

export const visitorInclude = Prisma.validator<Prisma.VisitorInclude>()({
  FollowUpEntry: latestAssignee,
});

export const memberInclude = Prisma.validator<Prisma.MemberInclude>()({
  _count: { select: { AttendanceRecord: { where: { present: true } } } },
  FollowUpAsSubject: latestAssignee,
});

type VisitorRow = Prisma.VisitorGetPayload<{ include: typeof visitorInclude }>;
type MemberRow = Prisma.MemberGetPayload<{ include: typeof memberInclude }>;

/** A first-timer who has no account yet: everything the intake form asked. */
export function toVisitorPerson(v: VisitorRow): FollowUpPerson {
  const entry = v.FollowUpEntry[0] ?? null;
  const assignee = entry?.Assignee ?? null;
  return {
    id: v.id,
    kind: 'VISITOR',
    name: personName(v),
    photoUrl: null,
    status: 'FIRST_TIMER',
    hasAccount: false,
    assignedTo: assignee ? { id: assignee.id, name: personName(assignee) } : null,
    entryId: entry?.id ?? null,
    phone: v.phone,
    email: v.email,
    gender: v.gender,
    dateOfBirth: v.dateOfBirth,
    address: v.address,
    occupation: v.occupation,
    invitedBy: v.invitedBy,
    howTheyHeard: v.howDidYouLearn,
    membershipInterest: v.membershipInterest,
    prayerPoint: v.prayerPoint,
    memberSince: null,
    attended: 0,
    since: v.submittedAt.toISOString(),
  };
}

/** Somebody already on the roll: attendance stands in for the intake form. */
export function toMemberPerson(m: MemberRow): FollowUpPerson {
  const entry = m.FollowUpAsSubject[0] ?? null;
  const attended = m._count.AttendanceRecord;
  return {
    id: m.id,
    kind: 'MEMBER',
    name: personName(m),
    photoUrl: m.photoUrl,
    status: memberStatusFor(m.status, attended, entry?.sourceType ?? null, entry?.outcome ?? null),
    hasAccount: true,
    assignedTo: entry?.Assignee ? { id: entry.Assignee.id, name: personName(entry.Assignee) } : null,
    entryId: entry?.id ?? null,
    phone: m.phone,
    email: m.email,
    gender: m.gender,
    dateOfBirth: m.dateOfBirth ? m.dateOfBirth.toISOString() : null,
    address: m.address,
    occupation: null,
    invitedBy: null,
    howTheyHeard: null,
    membershipInterest: null,
    prayerPoint: null,
    memberSince: m.joinedAt.toISOString(),
    attended,
    since: m.joinedAt.toISOString(),
  };
}
