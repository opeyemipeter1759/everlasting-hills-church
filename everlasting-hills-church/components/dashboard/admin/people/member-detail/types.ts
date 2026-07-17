import type { PersonRole } from "@/lib/api/people";

export interface CarePerson {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

export interface MemberDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  weddingAnniversary: string | null;
  address: string | null;
  joinedAt: string;
  bio: string | null;
  photoUrl: string | null;
  status: string;
  tags: string[];
  Profile: { role: PersonRole } | null;
  EngagementScore: {
    score: number;
    attendanceScore: number;
    sermonScore: number;
    givingScore: number;
    communityScore: number;
  } | null;
  AttendanceRecord: {
    id: string;
    present: boolean;
    checkedInAt: string;
    Service: { id: string; name: string; scheduledAt: string };
  }[];
  PastorNote: { id: string; content: string; createdAt: string }[];
  FollowUpTask: {
    id: string;
    title: string;
    dueDate: string | null;
    done: boolean;
    createdAt: string;
  }[];
  UnitMember: { id: string; isLead: boolean; isAssistant: boolean; Unit: { id: string; name: string } }[];
  CareAsMember: { id: string; Leader: CarePerson }[];
  CareAsLeader: { id: string; Member: CarePerson }[];
}

export function completion(m: MemberDetail): number {
  const checks = [
    Boolean(m.photoUrl),
    Boolean(m.email),
    Boolean(m.phone),
    Boolean(m.gender),
    Boolean(m.dateOfBirth),
    Boolean(m.address),
    m.UnitMember.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
