import type { MasterListStatus } from './master-list.util';

/** One person from the Master List, in full — member or first-timer alike. */
export interface FollowUpPerson {
  id: string;
  kind: 'MEMBER' | 'VISITOR';
  name: string;
  photoUrl: string | null;
  status: MasterListStatus;
  hasAccount: boolean;
  assignedTo: { id: string; name: string } | null;
  /** The follow-up entry to reassign, when one exists. */
  entryId: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  /** Visitors only — what the first-timer form asked them. */
  occupation: string | null;
  invitedBy: string | null;
  howTheyHeard: string | null;
  membershipInterest: string | null;
  prayerPoint: string | null;
  /** Members only. */
  memberSince: string | null;
  attended: number;
  /** When they first came to the church's notice. */
  since: string;
  /** A status asked for but not yet approved by a leader. */
  statusAwaitingApproval?: MasterListStatus | null;
}
