import { FollowUpStage, Prisma, Role } from '@prisma/client';

// ADMIN_HEAD is merged with ADMIN (same level) — full church-wide access.
export const ADMIN_PLUS: Role[] = [Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];

export const WORKING_STAGES: FollowUpStage[] = [
  FollowUpStage.ASSIGNED,
  FollowUpStage.IN_PROGRESS,
  FollowUpStage.REOPENED,
];

export const ENTRY_INCLUDE = {
  Unit: { select: { id: true, name: true, departmentId: true } },
  Member: {
    select: {
      id: true, firstName: true, lastName: true, photoUrl: true, phone: true, email: true, status: true,
      gender: true, dateOfBirth: true, address: true, joinedAt: true, householdId: true,
    },
  },
  Visitor: {
    select: {
      id: true, firstName: true, lastName: true, phone: true, email: true,
      gender: true, dateOfBirth: true, address: true, occupation: true,
      howDidYouLearn: true, invitedBy: true, submittedAt: true, serviceId: true, shareForConnections: true,
    },
  },
  Assignee: { select: { id: true, firstName: true, lastName: true, photoUrl: true, gender: true } },
  AddedBy: { select: { id: true, Member: { select: { firstName: true, lastName: true } } } },
  SentToPastorBy: { select: { id: true, Member: { select: { firstName: true, lastName: true } } } },
  Logs: {
    orderBy: { createdAt: 'asc' as const },
    include: { By: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
  },
  Connections: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      SuggestedMember: { select: { id: true, firstName: true, lastName: true, photoUrl: true, phone: true, email: true } },
      IntroducedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.FollowUpEntryInclude;

export type EntryWithRelations = Prisma.FollowUpEntryGetPayload<{ include: typeof ENTRY_INCLUDE }>;

export interface AbsenteeDetail {
  category: 'NEVER_ATTENDED' | 'CONSECUTIVE_ABSENCES' | 'BELOW_50_PERCENT' | null;
  missedServices: { id: string; name: string; scheduledAt: string }[];
  attendedCount: number;
  totalRecent: number;
}
