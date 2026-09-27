"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useMe } from "@/lib/api";
import type { EvangelismSummary } from "@/lib/api/evangelism";
import { SummaryPanel } from "./SummaryPanel";
import { SectionHeader } from "./bits";
import { ContactsTab } from "./ContactsTab";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Home: the figures, then everyone the team has preached to. Open anyone for
 * their full details, who is following them up, and the team's feedback.
 */
export function OverviewTab({
  canLead,
  summary,
  onOpenContact,
}: {
  canLead: boolean;
  summary: UseQueryResult<EvangelismSummary>;
  onOpenContact: (id: string) => void;
}) {
  const { data: me } = useMe();
  const s = summary.data;
  const firstName = me?.member?.firstName;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white/50">
          {s
            ? s.mine.inWindow > 0
              ? `You're following up ${s.mine.inWindow} ${s.mine.inWindow === 1 ? "person" : "people"}${s.mine.overdue ? ` — ${s.mine.overdue} overdue` : ""}.`
              : "Nobody is waiting on you right now."
            : " "}
        </p>
      </div>

      <SummaryPanel summary={s} loading={summary.isLoading} />

      <section className="space-y-4">
        <SectionHeader
          title="People preached to"
          description="Tap anyone to see all their details, who is following them up, and the team's feedback."
        />
        <ContactsTab canLead={canLead} onOpenContact={onOpenContact} />
      </section>
    </div>
  );
}
