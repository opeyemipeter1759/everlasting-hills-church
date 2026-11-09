import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

interface AtRiskPerson {
  userId: string;
  userName: string;
  photoUrl: string | null;
  phone: string | null;
  /** The last service of any kind they checked into, YYYY-MM-DD. */
  lastSeen: string | null;
}

/**
 * Active members who need checking on, judged on the Sundays held since each
 * joined. Each person is in one list only, the most serious that fits.
 */
export interface MembersAtRisk {
  /** Missed the last three or more Sundays. */
  absentConsecutiveWeeks: (AtRiskPerson & { consecutiveAbsences: number; presentCount: number; totalCount: number })[];
  /** Never checked in, after three or more Sundays. */
  neverAttended: (AtRiskPerson & { joinedAt: string; sundaysSinceJoining: number })[];
  /** Came to fewer than half of the last eight Sundays. */
  belowFiftyPercent: (AtRiskPerson & { presentCount: number; totalCount: number; rate: number })[];
  window: { sundays: number; from: string | null; to: string | null };
}

export function useMembersAtRisk() {
  return useQuery({
    queryKey: ["members", "at-risk"],
    queryFn: () => api.get<MembersAtRisk>("/members/at-risk"),
    enabled: typeof window !== "undefined",
  });
}
