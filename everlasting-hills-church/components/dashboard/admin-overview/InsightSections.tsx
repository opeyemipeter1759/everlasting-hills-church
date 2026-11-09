import type { AdminDashboardData } from "@/lib/types/admin-dashboard";
import GivingSummaryCard from "./GivingSummaryCard";
import AIInsightsCard from "./AIInsightsCard";
import AttendanceTrendCard from "./AttendanceTrendCard";
import FirstTimerBreakdownCard from "./FirstTimerBreakdownCard";
import FirstTimerFunnelCard from "./FirstTimerFunnelCard";
import CalendarSummaryCard from "./CalendarSummaryCard";
import PastoralCareCard from "./PastoralCareCard";
import BirthdayAnniversaryCard from "./BirthdayAnniversaryCard";

export interface SectionProps {
  data: AdminDashboardData;
  /** Whether the admin has not dismissed the card with this id. */
  visible: (id: string) => boolean;
  dismiss: (id: string) => void;
}

/** The dashboard's upper half: giving and insights, attendance, funnel and events, care and birthdays. */
export default function InsightSections({ data, visible, dismiss }: SectionProps) {
  return (
    <>
      {/* Executive insight */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Null below PASTOR: giving is pastor-only. */}
        {visible("giving") && data.giving && (
          <GivingSummaryCard giving={data.giving} viewMoreHref="/dashboard/giving" onDismiss={() => dismiss("giving")} />
        )}
        {visible("ai") && (
          <AIInsightsCard trend={data.attendanceTrend} fallback={data.aiInsights} onDismiss={() => dismiss("ai")} />
        )}
      </div>

      {/* Attendance trend + First-timer breakdown — side by side */}
      {visible("attendance") && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <AttendanceTrendCard
            data={data.attendanceTrend}
            viewMoreHref="/dashboard/analytics/attendance"
            onDismiss={() => dismiss("attendance")}
          />
          <FirstTimerBreakdownCard viewMoreHref="/dashboard/admin/first-timers" onDismiss={() => dismiss("attendance")} />
        </div>
      )}

      {/* Funnel + events */}
      <div className="grid gap-6 lg:grid-cols-2">
        {visible("funnel") && (
          <FirstTimerFunnelCard viewMoreHref="/dashboard/admin/first-timers/funnel" onDismiss={() => dismiss("funnel")} />
        )}
        {visible("events") && (
          <CalendarSummaryCard summary={data.calendar} viewMoreHref="/dashboard/admin/calendar" onDismiss={() => dismiss("events")} />
        )}
      </div>

      {/* Pastoral care + birthdays */}
      <div className="grid gap-6 lg:grid-cols-2">
        {visible("pastoral") && <PastoralCareCard care={data.pastoralCare} onDismiss={() => dismiss("pastoral")} />}
        {visible("birthdays") && (
          <BirthdayAnniversaryCard
            celebrations={data.celebrations}
            viewMoreHref="/dashboard/admin/members"
            onDismiss={() => dismiss("birthdays")}
          />
        )}
      </div>
    </>
  );
}
