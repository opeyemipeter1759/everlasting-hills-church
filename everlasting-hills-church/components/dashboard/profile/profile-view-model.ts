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
  /** Optional metrics — shown when backend wires these through. */
  prayerCount?: number;
  testimonyCount?: number;
}
