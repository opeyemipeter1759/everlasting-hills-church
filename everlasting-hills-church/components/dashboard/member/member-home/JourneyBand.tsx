import type { MemberHomeProps } from "./types";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { WarmAttendanceStat } from "./WarmAttendanceStat";
import { WarmStreakStat } from "./WarmStreakStat";
import { MonthlyAttendanceChart } from "./MonthlyAttendanceChart";
import { DiscipleshipTrackerCard } from "./DiscipleshipTrackerCard";

interface JourneyBandProps {
  isNewMember: boolean;
  member: MemberHomeProps["member"];
  prayerCount: number;
  ministryUnit?: MemberHomeProps["ministryUnit"];
  attendanceRate: number;
  attendanceCount: number;
  lastServiceDate: string | null;
  recentServices: MemberHomeProps["recentServices"];
  streakWeeks: number;
  nextService: MemberHomeProps["nextService"];
  discipleshipMilestones?: MemberHomeProps["discipleshipMilestones"];
  monthlyAttendance: MemberHomeProps["monthlyAttendance"];
}

/** Band 3 — "My Journey": onboarding checklist for new members, or their
 *  attendance/streak/discipleship stats once they have some history. */
export function JourneyBand({
  isNewMember, member, prayerCount, ministryUnit,
  attendanceRate, attendanceCount, lastServiceDate, recentServices,
  streakWeeks, nextService, discipleshipMilestones, monthlyAttendance,
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
          lastServiceDate={lastServiceDate}
          recentServices={recentServices}
        />
        <WarmStreakStat
          streakWeeks={streakWeeks}
          nextService={nextService}
          ministryUnit={ministryUnit}
        />
      </div>

    </>
  );
}
