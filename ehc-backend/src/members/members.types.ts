import { Prisma } from '@prisma/client';

export interface DirectoryQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  role?: string;
  status?: string;
  gender?: string;
  unit?: string;
  hasUnit?: string;
  joinedFrom?: string;
  joinedTo?: string;
  birthMonth?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface UpdateMemberInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string;
}

export interface BulkMemberOpInput {
  ids: string[];
  op: 'status' | 'addTag' | 'removeTag';
  value: string;
}

export const DIRECTORY_INCLUDE = {
  Profile: { select: { id: true, userId: true } },
  EngagementScore: { select: { score: true } },
  _count: { select: { AttendanceRecord: true } },
  UnitMember: { include: { Unit: { select: { id: true, name: true } } } },
  CareAsMember: {
    where: { status: 'ACTIVE' as const },
    include: { Leader: { select: { id: true, firstName: true, lastName: true } } },
  },
} satisfies Prisma.MemberInclude;

export type DirectoryRow = Prisma.MemberGetPayload<{ include: typeof DIRECTORY_INCLUDE }>;
