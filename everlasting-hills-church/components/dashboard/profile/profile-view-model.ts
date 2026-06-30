export interface UnitMembership {
  id: string;
  name: string;
  description: string | null;
  isLead: boolean;
  isAssistant: boolean;
}

export interface ProfileViewModel {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  photoUrl: string | null;
  address: string | null;
  role: string | null;
  joinedAt: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  weddingAnniversary: string | null;
  tags: string[];
  household: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  tiktok: string | null;
  units: UnitMembership[];
  /** Optional engagement metrics — filled in when backend wires these through. */
  prayerCount?: number;
  testimonyCount?: number;
  attendanceRate?: number;        // 0–100 percentage
  totalServicesAttended?: number;
  sermonListenStreak?: number;    // consecutive days
  bookmarkCount?: number;
}
