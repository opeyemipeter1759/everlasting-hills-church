"use client";

import { useState } from "react";
import { FollowUpHeader } from "./FollowUpHeader";
import { FollowUpTabs, TABS_BOTTOM_SPACE } from "./FollowUpTabs";
import { useFollowUpTabs, type FollowUpTab } from "./useFollowUpTabs";
import { useFollowUpSummary } from "./useFollowUpSummary";
import MasterListPipeline from "./MasterListPipeline";
import AssignedToMe from "./AssignedToMe";
import { FollowUpReport } from "./FollowUpReport";
import OverviewYear from "./v2/overview/OverviewYear";

/**
 * The Follow Up board. Every list reads the first-timer pipeline, and each tab
 * badge is the API's total for the very list that tab opens: All on the
 * Master list, your caseload on Assigned to me, the opted out on Opted out.
 */
export default function FollowUpBoard() {
  const tabs = useFollowUpTabs();
  const summary = useFollowUpSummary();
  const [picked, setActive] = useState<FollowUpTab>("master");
  // A tab the viewer doesn't get falls back to their first, without being
  // remembered, so a lead whose access is still loading still lands on the Master list.
  const active = tabs.some((tab) => tab.id === picked) ? picked : (tabs[0]?.id ?? "mine");

  // Report is a write-up, not a list, so it carries no count. While the
  // figures load there are no counts at all: a badge reading 0 would be read
  // as "none", which is a different thing from "not known yet".
  const counts = summary.isLoading ? {} : { master: summary.total, mine: summary.assignedToMe, optedOut: summary.optedOut };

  return (
    <div className={`space-y-4 md:px-5 ${TABS_BOTTOM_SPACE}`}>
      <FollowUpHeader />
      <FollowUpTabs tabs={tabs} active={active} counts={counts} onChange={setActive} />

      {active === "master" ? (
        <section role="tabpanel" aria-label="Master list">
          <MasterListPipeline linkThreads />
        </section>
      ) : active === "overview" ? (
        <section role="tabpanel" aria-label="Overview">
          <OverviewYear />
        </section>
      ) : active === "mine" ? (
        <section role="tabpanel" aria-label="Assigned to me">
          <AssignedToMe />
        </section>
      ) : active === "optedOut" ? (
        <section role="tabpanel" aria-label="Opted out">
          <MasterListPipeline fixed={{ status: "OPTED_OUT" }} empty="Nobody has opted out." />
        </section>
      ) : (
        <section role="tabpanel" aria-label="Report">
          <FollowUpReport />
        </section>
      )}
    </div>
  );
}
