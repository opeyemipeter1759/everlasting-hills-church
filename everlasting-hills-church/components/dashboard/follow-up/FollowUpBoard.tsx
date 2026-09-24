"use client";

import { useEffect, useState } from "react";
import { FollowUpHeader } from "./FollowUpHeader";
import { FollowUpTabs } from "./FollowUpTabs";
import { useFollowUpTabs, type FollowUpTab } from "./useFollowUpTabs";
import { useFollowUpSummary } from "./useFollowUpSummary";
import MasterList from "./MasterList";
import AssignedToMe from "./AssignedToMe";

const PANEL_NOTE: Record<FollowUpTab, string> = {
  master: "Everyone the church is still working to settle in. Once someone is integrated they pass to the Integration Team.",
  mine: "The people you are responsible for reaching.",
  report: "What your unit has done this week, ready to send.",
};

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
    <div className="space-y-4 md:px-5">
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
        <section
          role="tabpanel"
          aria-label={tabs.find((tab) => tab.id === active)?.label}
          className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-white/15 dark:bg-white/[0.02]"
        >
          <p className="text-sm font-semibold text-[#111] dark:text-white">
            {tabs.find((tab) => tab.id === active)?.label}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-white/45">{PANEL_NOTE[active]}</p>
          <p className="mt-3 text-xs text-gray-400 dark:text-white/35">Being built.</p>
        </section>
      )}
    </div>
  );
}
