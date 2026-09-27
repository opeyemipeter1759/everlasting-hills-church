import { Role } from '@prisma/client';

/** Church admins: full access to Evangelism whether or not they are on the team. */
export const EVANGELISM_ADMIN_ROLES: Role[] = [Role.ADMIN, Role.ADMIN_HEAD, Role.PASTOR, Role.SUPER_ADMIN];

export const SAVED_STATUSES = ['YES', 'NO', 'ALREADY'] as const;
export type SavedStatus = (typeof SAVED_STATUSES)[number];

export const NEXT_ACTIONS = ['FOLLOW_UP_CALL', 'CALL_BACK', 'NEEDS_VISIT', 'INVITE'] as const;
export type NextAction = (typeof NEXT_ACTIONS)[number];

/** Where a contact is in their follow-up, in the order it usually goes. */
export const CONTACT_STATUSES = [
  'NEW',
  'CALL_DONE',
  'CALL_BACK',
  'NEEDS_VISIT',
  'VISITED',
  'INVITED',
  'ATTENDED',
  'JOINED',
  'NOT_INTERESTED',
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

/** Nothing more to follow up once they are in, or have said no. */
export const FINISHED_STATUSES: ContactStatus[] = ['JOINED', 'NOT_INTERESTED'];

/** What a team member can log against a contact. */
export const ACTION_KINDS = ['CALL', 'VISIT', 'MESSAGE', 'NOTE'] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];

export const REVIEW_OUTCOMES = ['HANDED_OVER', 'EXTENDED', 'CLOSED'] as const;
export type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];

export const TASK_TYPES = ['CALL', 'VISIT', 'INVITE', 'PRAYER', 'OTHER'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const FOLLOW_UP_FLAGS = ['DUE', 'OVERDUE', 'REVIEW'] as const;
export type FollowUpFlag = (typeof FOLLOW_UP_FLAGS)[number];

/** Who is asking, as far as Evangelism is concerned. */
export interface EvangelismViewer {
  unitId: string;
  departmentId: string | null;
  /** Unit lead/assistant, head of Growth & Outreach, or a church admin. */
  canLead: boolean;
  memberId: string | null;
  /** For who has read which feedback thread. */
  profileId: string | null;
  name: string;
}
