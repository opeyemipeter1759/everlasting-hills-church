"use client";

import { useEffect, useState } from "react";
import { FollowUpHeader } from "./FollowUpHeader";
import { FollowUpTabs, TABS_BOTTOM_SPACE } from "./FollowUpTabs";
import { useFollowUpTabs, type FollowUpTab } from "./useFollowUpTabs";
import { useFollowUpSummary } from "./useFollowUpSummary";
import MasterList from "./MasterList";
import AssignedToMe from "./AssignedToMe";
import { FollowUpReport } from "./FollowUpReport";

export default function FollowUpBoard() {
  const tabs = useFollowUpTabs();
  const summary = useFollowUpSummary();
  const [active, setActive] = useState<FollowUpTab>("master");

  // Report is a write-up, not a list, so it carries no count. While the
  // figures load there are no counts at all — a badge reading 0 would be read
  // as "none", which is a different thing from "not known yet".
  const counts = summary.isLoading
    ? {}
    : { master: summary.total, mine: summary.assignedToMe };
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.id === active)) setActive(tabs[0].id);
  }, [tabs, active]);

  return (
    <div className={`space-y-4 md:px-5 ${TABS_BOTTOM_SPACE}`}>
      <FollowUpHeader />
      <FollowUpTabs tabs={tabs} active={active} counts={counts} onChange={setActive} />

      {active === "master" ? (
        <section role="tabpanel" aria-label="Master list">
          <MasterList fixed={{ scope: "FOLLOW_UP" }} />
        </section>
      ) : active === "mine" ? (
        <section role="tabpanel" aria-label="Assigned to me">
          <AssignedToMe />
        </section>
      ) : (
        <section role="tabpanel" aria-label="Report">
          <FollowUpReport />
        </section>
      )}
    </div>
  );
}
