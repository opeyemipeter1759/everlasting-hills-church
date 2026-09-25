"use client";

import { useCallback, useState } from "react";
import { HeartHandshake, UserCheck, UserMinus } from "lucide-react";
import { FollowUpTabs, TABS_BOTTOM_SPACE } from "@/components/dashboard/follow-up/FollowUpTabs";
import MasterList from "@/components/dashboard/follow-up/MasterList";
import AssignedToMe from "@/components/dashboard/follow-up/AssignedToMe";
import { useFollowUpCounts } from "@/lib/api/follow-up-counts";
import type { MasterListPage } from "@/lib/api/follow-up-pipeline";
import { IntegrationHeader } from "./IntegrationHeader";

type IntegrationTab = "members" | "away" | "mine";

const TABS = [
  { id: "members" as const, label: "Integrated members", icon: HeartHandshake },
  { id: "away" as const, label: "Away", icon: UserMinus },
  { id: "mine" as const, label: "Assigned to me", icon: UserCheck },
];

const NOTE: Record<IntegrationTab, string> = {
  members: "Everyone Follow Up has settled in. Keep an eye on them — this is where they land.",
  away: "Members who have stopped coming. Somebody from this team should reach them.",
  mine: "The people you are responsible for staying in touch with.",
};

/**
 * The Integration Team's page.
 *
 * Follow Up meets the people who have just arrived and walks them in; the
 * moment somebody is integrated they leave that list and appear here, because
 * from then on the work is different — not settling them in, but noticing
 * when one of them quietly stops coming.
 */
export default function IntegrationBoard() {
  const [active, setActive] = useState<IntegrationTab>("members");
  const { data: counts, isLoading } = useFollowUpCounts();
  // The Absent card counts whatever the open list is showing, so it moves
  // with the tab and the filters.
  const [listMeta, setListMeta] = useState<MasterListPage["meta"] | undefined>();
  const onMeta = useCallback((meta: MasterListPage["meta"] | undefined) => setListMeta(meta), []);
  const changeTab = (tab: IntegrationTab) => {
    setListMeta(undefined);
    setActive(tab);
  };

  const tabCounts = isLoading
    ? {}
    : {
        members: counts?.byStatus.INTEGRATED ?? 0,
        away: counts?.byStatus.AWAY ?? 0,
        mine: counts?.assignedToMe ?? 0,
      };

  return (
    <div className={`space-y-4 md:px-5 ${TABS_BOTTOM_SPACE}`}>
      <IntegrationHeader absence={listMeta} />
      <FollowUpTabs
        tabs={TABS}
        active={active}
        counts={tabCounts}
        label="Integration Team views"
        onChange={changeTab}
      />

      <p className="text-sm text-gray-500 dark:text-white/45">{NOTE[active]}</p>

      <section role="tabpanel" aria-label={TABS.find((tab) => tab.id === active)?.label}>
        {active === "mine" ? (
          <AssignedToMe scope="INTEGRATION" onMeta={onMeta} />
        ) : (
          <MasterList
            key={active}
            fixed={{ scope: "INTEGRATION", status: active === "away" ? "AWAY" : "INTEGRATED" }}
            onMeta={onMeta}
          />
        )}
      </section>
    </div>
  );
}
