import type { PersonRole } from "@/lib/api/people";

export type AnnouncementStatus = "DRAFT" | "PUBLISHED";
export type TargetGender = "MALE" | "FEMALE";

export interface TargetPerson {
  id: string; // Profile id
  name: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  audience: string;
  sendEmail: boolean;
  status: AnnouncementStatus;
  recipients: number;
  createdAt: string;
  updatedAt: string;
  targetRoles: PersonRole[];
  targetGenders: TargetGender[];
  targetProfileIds: string[];
  targetProfileNames: string[];
  eventTime: string | null;
  venue: string | null;
}

export interface AnnouncementFormValues {
  title: string;
  body: string;
  imageUrl: string;
  sendEmail: boolean;
  targetRoles: PersonRole[];
  targetGenders: TargetGender[];
  targetPeople: TargetPerson[];
  eventTime: string;
  venue: string;
}

export const EMPTY_FORM: AnnouncementFormValues = {
  title: "",
  body: "",
  imageUrl: "",
  sendEmail: true,
  targetRoles: [],
  targetGenders: [],
  targetPeople: [],
  eventTime: "",
  venue: "",
};

export type AnnouncementFilter = "ALL" | AnnouncementStatus;
