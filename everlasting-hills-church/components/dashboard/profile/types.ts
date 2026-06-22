import type { MeResponse } from '@/lib/api';

export type Section = 'personal' | 'about' | 'address' | 'social';

export interface GeneralTabProps {
  profile: MeResponse;
  onSave?: (data: any) => void;
}

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occupation: string;
  bio: string;
  address: string;
  state: string;
  country: string;
  dateOfBirth: string;
  twitter: string;
  instagram: string;
  facebook: string;
  linkedin: string;
}

export interface SectionProps {
  editingSection: Section | null;
  setEditingSection: (s: Section) => void;
  onSave: (s: Section) => void;
  onCancel: (s: Section) => void;
}
