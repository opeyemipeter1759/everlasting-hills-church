"use client";

import { useState } from "react";
import { useAdminDashboardData } from "./useAdminDashboardData";
import { EmptyState, ErrorState, LoadingState } from "./DashboardStates";
import WelcomeHero from "./WelcomeHero";
import StatCardsRow from "./StatCardsRow";
import InsightSections from "./InsightSections";
import ActionSections from "./ActionSections";

/** The Super Admin dashboard overview: one request (GET /admin/home) feeds every card. */
export default function AdminDashboardClient() {
  const { status, data, error, refetch } = useAdminDashboardData();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const dismiss = (id: string) => setHidden((prev) => new Set(prev).add(id));
  const visible = (id: string) => !hidden.has(id);

  const members = data?.stats.find((s) => s.key === "members")?.value;
  const attendance = data?.stats.find((s) => s.key === "attendance")?.value;

  return (
    <div className="space-y-6">
      <WelcomeHero members={members} attendance={attendance} />

      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState message={error} onRetry={refetch} />}
      {status === "empty" && <EmptyState />}

      {status === "success" && data && (
        <div className="space-y-6">
          <StatCardsRow stats={data.stats} />
          <InsightSections data={data} visible={visible} dismiss={dismiss} />
          <ActionSections data={data} visible={visible} dismiss={dismiss} />
        </div>
      )}
    </div>
  );
}
