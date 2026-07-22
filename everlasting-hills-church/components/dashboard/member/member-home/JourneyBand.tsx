import type { MemberHomeProps, StreakState } from "./types";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { WarmAttendanceStat } from "./WarmAttendanceStat";
import { WarmStreakStat } from "./WarmStreakStat";
import { MonthlyAttendanceChart } from "./MonthlyAttendanceChart";
import { DiscipleshipTrackerCard } from "./DiscipleshipTrackerCard";

interface JourneyBandProps {
  isNewMember: boolean;
  member: MemberHomeProps["member"];
  memberDisplayId: string;
  prayerCount: number;
  ministryUnit?: MemberHomeProps["ministryUnit"];
  attendanceRate: number;
  attendanceCount: number;
  attendanceTotal: number;
  lastServiceDate: string | null;
  recentServices: MemberHomeProps["recentServices"];
  streak: StreakState;
  coursesCompleted: number;
  sermonsCompleted: number;
  nextService: MemberHomeProps["nextService"];
  discipleshipMilestones?: MemberHomeProps["discipleshipMilestones"];
  monthlyAttendance: MemberHomeProps["monthlyAttendance"];
}

/** Band 3 — "My Journey": onboarding checklist for new members, or their
 *  attendance/streak/discipleship stats once they have some history. */
export function JourneyBand({
  isNewMember, member, memberDisplayId, prayerCount, ministryUnit,
  attendanceRate, attendanceCount, attendanceTotal, lastServiceDate, recentServices,
  streak, coursesCompleted, sermonsCompleted, nextService, discipleshipMilestones, monthlyAttendance,
}: JourneyBandProps) {
/*   if (isNewMember) {
    return (
      <div>Hell</div>
     /// <OnboardingChecklist member={member} prayerCount={prayerCount} ministryUnit={ministryUnit} />
    );
  } */

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <WarmAttendanceStat
          attendanceRate={attendanceRate}
          attendanceCount={attendanceCount}
          attendanceTotal={attendanceTotal}
          lastServiceDate={lastServiceDate}
          recentServices={recentServices}
        />
        <WarmStreakStat
          memberDisplayId={memberDisplayId}
          streak={streak}
          coursesCompleted={coursesCompleted}
          sermonsCompleted={sermonsCompleted}
          nextService={nextService}
          ministryUnit={ministryUnit}
        />
      </div>

    </>
  );
}
