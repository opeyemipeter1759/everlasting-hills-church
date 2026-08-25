export interface VisitorRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  attendanceType: string | null;
  membershipInterest: string | null;
  howDidYouLearn: string | null;
  locatedInIbadan: boolean | null;
  bornAgain: string | null;
  occupation: string | null;
  submittedAt: string;
  hasOnlineCheckIn?: boolean;
  // The rest of what the first-timer form collects. These were captured on the
  // public form and stored all along, but the dashboard was only mapping a
  // subset, so the person reading the record could not see who invited the
  // visitor or where they live.
  invitedBy?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  whatsappInterest?: boolean | null;
  serviceExperience?: string | null;
  prayerPoint?: string | null;
}
