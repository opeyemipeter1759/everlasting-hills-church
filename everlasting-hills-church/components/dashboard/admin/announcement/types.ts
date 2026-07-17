export type AnnouncementStatus = "DRAFT" | "PUBLISHED";

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
}

export interface AnnouncementFormValues {
  title: string;
  body: string;
  imageUrl: string;
  sendEmail: boolean;
}

export const EMPTY_FORM: AnnouncementFormValues = {
  title: "",
  body: "",
  imageUrl: "",
  sendEmail: true,
};

export type AnnouncementFilter = "ALL" | AnnouncementStatus;
