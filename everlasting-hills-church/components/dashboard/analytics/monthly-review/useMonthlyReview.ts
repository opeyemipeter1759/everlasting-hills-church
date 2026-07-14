"use client";

import { useState } from "react";
import { addMonths, endOfMonth, format, isSameMonth, startOfMonth, subMonths } from "date-fns";
import { usePeople, useUnitOptions, type PersonRow, type UnitOption } from "@/lib/api/people";

const ROW_CAP = 1000; // generous cap on a single month's cohort — see `truncated` below

function monthRange(month: Date) {
  return {
    from: format(startOfMonth(month), "yyyy-MM-dd"),
    to: format(endOfMonth(month), "yyyy-MM-dd"),
  };
}

function pct(curr: number, prev: number) {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 100);
}

/** Cheap `limit: 1` counts — this is all the previous month is needed for (trend deltas). */
function usePrevMonthCounts(month: Date) {
  const { from, to } = monthRange(month);
  const all = usePeople({ joinedFrom: from, joinedTo: to, limit: 1 });
  const visitors = usePeople({ joinedFrom: from, joinedTo: to, role: "VISITOR", limit: 1 });
  const teams = usePeople({ joinedFrom: from, joinedTo: to, hasUnit: "true", limit: 1 });

  const total = all.data?.meta.total ?? 0;
  const visitorCount = visitors.data?.meta.total ?? 0;

  return {
    isLoading: all.isLoading || visitors.isLoading || teams.isLoading,
    isFetching: all.isFetching || visitors.isFetching || teams.isFetching,
    members: Math.max(total - visitorCount, 0),
    visitors: visitorCount,
    teams: teams.data?.meta.total ?? 0,
  };
}

export interface TeamTally {
  name: string;
  count: number;
}

/** Every team gets an entry, even 0 — this is the "full picture", not just the winners. */
function buildTeamBoard(rows: PersonRow[], allUnits: UnitOption[]): TeamTally[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const unit of row.units) counts.set(unit.name, (counts.get(unit.name) ?? 0) + 1);
  }
  for (const u of allUnits) if (!counts.has(u.name)) counts.set(u.name, 0);

  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export interface ReviewCard {
  key: "members" | "teams" | "visitors";
  label: string;
  value: number;
  trend: number;
}

export function useMonthlyReview() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { from, to } = monthRange(month);

  // Full rows for the current month — gives us names + team assignments for free,
  // instead of separate count-only queries.
  const currQuery = usePeople({ joinedFrom: from, joinedTo: to, limit: ROW_CAP, sortBy: "joinedAt", sortOrder: "desc" });
  const unitsQuery = useUnitOptions();
  const prev = usePrevMonthCounts(subMonths(month, 1));

  const rows = currQuery.data?.data ?? [];
  const total = currQuery.data?.meta.total ?? rows.length;
  const members = rows.filter((r) => r.role !== "VISITOR");
  const visitors = rows.filter((r) => r.role === "VISITOR");
  const teamMembers = members.filter((r) => r.units.length > 0);
  const teamLeaderboard = buildTeamBoard(members, unitsQuery.data ?? []);

  const teamRate = members.length > 0 ? Math.round((teamMembers.length / members.length) * 100) : 0;

  const cards: ReviewCard[] = [
    { key: "members", label: "New Members", value: members.length, trend: pct(members.length, prev.members) },
    { key: "teams", label: "Integrated To A Team", value: teamMembers.length, trend: pct(teamMembers.length, prev.teams) },
    { key: "visitors", label: "New Visitors", value: visitors.length, trend: pct(visitors.length, prev.visitors) },
  ];

  return {
    label: format(month, "MMMM yyyy"),
    isCurrentMonth: isSameMonth(month, new Date()),
    isLoading: currQuery.isLoading || prev.isLoading,
    isFetching: currQuery.isFetching || prev.isFetching,
    teamRate,
    cards,
    members,
    visitors,
    teamLeaderboard,
    truncated: total > rows.length,
    goPrev: () => setMonth((m) => subMonths(m, 1)),
    goNext: () => setMonth((m) => addMonths(m, 1)),
    goToday: () => setMonth(startOfMonth(new Date())),
  };
}
