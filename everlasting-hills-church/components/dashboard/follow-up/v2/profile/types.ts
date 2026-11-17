import type { FirstTimerProfileData } from "@/lib/api/first-timer-profile";

/** What every section of the first-timer profile receives. */
export interface ProfileSectionProps {
  profile: FirstTimerProfileData;
  /** Re-read the profile, the lists and the counts after a change. */
  refresh: () => void;
}
