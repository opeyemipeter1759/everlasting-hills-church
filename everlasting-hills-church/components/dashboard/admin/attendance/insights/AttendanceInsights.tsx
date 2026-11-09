"use client";

import type { OverviewService } from "@/lib/api/attendance-roll";
import AttendaceAnalytic from "@/components/dashboard/analytics/attendanceAnalytic/AttendaceAnalytic";
import AtRiskTable from "../at-risk/AtRiskTable";
import HeadcountTrend from "./HeadcountTrend";

/**
 * The Insights tab, in the order a pastor reads it: how many came and who,
 * which members need checking on, then the check-in charts in detail.
 */
export default function AttendanceInsights({ services }: { services: OverviewService[] }) {
  return (
    <div className="space-y-5">
      <HeadcountTrend services={services} />
      <AtRiskTable />
      <AttendaceAnalytic embedded />
    </div>
  );
}
