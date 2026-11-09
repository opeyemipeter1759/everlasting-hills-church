import MinistryUnitsOverview from "./MinistryUnitsOverview";
import RecentActivitiesCard from "./RecentActivitiesCard";
import QuickActionsCard from "./QuickActionsCard";
import FollowUpCard from "./FollowUpCard";
import WhatsAppCommunityCard from "./WhatsAppCommunityCard";
import ProjectPledgesCard from "./ProjectPledgesCard";
import type { SectionProps } from "./InsightSections";

/** The dashboard's lower half: to-do lists, pledges, units, recent activity and quick actions. */
export default function ActionSections({ data, visible, dismiss }: SectionProps) {
  return (
    <>
      {/* Two to-do lists side by side: who to call back, and who is still
          waiting to be added to the WhatsApp community. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FollowUpCard absent={data.absentMembers} />
        <WhatsAppCommunityCard />
      </div>

      {/* What the project has been pledged, and what has actually come in. */}
      <ProjectPledgesCard />

      {/* Ministry units — full width */}
      {visible("units") && (
        <MinistryUnitsOverview units={data.ministryUnits} viewMoreHref="/dashboard/admin/units" onDismiss={() => dismiss("units")} />
      )}

      {/* Activities + quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Null below PASTOR: the CMS audit log is pastor-only. */}
        {visible("activities") && data.recentActivities && (
          <RecentActivitiesCard
            activities={data.recentActivities}
            viewMoreHref="/dashboard/audit-log"
            onDismiss={() => dismiss("activities")}
          />
        )}
        <QuickActionsCard />
      </div>
    </>
  );
}
