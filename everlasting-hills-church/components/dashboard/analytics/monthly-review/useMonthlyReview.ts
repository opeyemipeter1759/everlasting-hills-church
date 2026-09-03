"use client";

import { useState } from "react";
import { addMonths, endOfMonth, format, isSameMonth, isWithinInterval, startOfMonth, subMonths } from "date-fns";
import { usePeople, useUnitOptions, type PersonRow, type UnitOption } from "@/lib/api/people";
import { useVisitorsList, type VisitorListRow } from "@/lib/api/visitors";

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

/** Visitors registered within a given month, from an already-fetched list —
 * one request covers every month shown, rather than one request per month. */
function visitorsInMonth(all: VisitorListRow[], month: Date): VisitorListRow[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  return all.filter((v) => isWithinInterval(new Date(v.submittedAt), { start, end }));
}

/** Cheap `limit: 1` counts — this is all the previous month is needed for (trend deltas). */
function usePrevMonthCounts(month: Date) {
  const { from, to } = monthRange(month);
  const all = usePeople({ joinedFrom: from, joinedTo: to, limit: 1 });
  const teams = usePeople({ joinedFrom: from, joinedTo: to, hasUnit: "true", limit: 1 });

  return {
    isLoading: all.isLoading || teams.isLoading,
    isFetching: all.isFetching || teams.isFetching,
    members: all.data?.meta.total ?? 0,
    teams: teams.data?.meta.total ?? 0,
  };
}

export interface TeamTally {
  name: string;
  count: number;
}

/** Every team gets an entry, even 0 — this is the "full picture", not just the
 * winners. Counts are each unit's live total roster size, not scoped to this
 * month's new joiners, so adding/removing a unit member is reflected here
 * right away instead of only once that person's join date falls in-month. */
function buildTeamBoard(allUnits: UnitOption[]): TeamTally[] {
  return allUnits
    .map((u) => ({ name: u.name, count: u.memberCount }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
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
  // instead of separate count-only queries. The Member directory only ever
  // contains real members: a Visitor (first-timer) has no Member/Profile record
  // at all until they convert, so every row here is genuinely a member already —
  // no "VISITOR" role exists to filter out.
  const currQuery = usePeople({ joinedFrom: from, joinedTo: to, limit: ROW_CAP, sortBy: "joinedAt", sortOrder: "desc" });
  const unitsQuery = useUnitOptions();
  const prev = usePrevMonthCounts(subMonths(month, 1));

  // Visitors ("first-timers") live in their own table entirely separate from
  // Member — fetched once (most-recent 1000 registrations) and filtered to the
  // selected month client-side, rather than one request per month.
  const visitorsQuery = useVisitorsList();
  const allVisitors = visitorsQuery.data ?? [];
  const visitors = visitorsInMonth(allVisitors, month);
  const prevVisitors = visitorsInMonth(allVisitors, subMonths(month, 1));

  const rows = currQuery.data?.data ?? [];
  const total = currQuery.data?.meta.total ?? rows.length;
  const members = rows;
  const teamMembers = members.filter((r) => r.units.length > 0);
  const teamLeaderboard = buildTeamBoard(unitsQuery.data ?? []);

  const teamRate = members.length > 0 ? Math.round((teamMembers.length / members.length) * 100) : 0;

  const cards: ReviewCard[] = [
    { key: "members", label: "New Members", value: members.length, trend: pct(members.length, prev.members) },
    { key: "teams", label: "Integrated To A Team", value: teamMembers.length, trend: pct(teamMembers.length, prev.teams) },
    { key: "visitors", label: "New Visitors", value: visitors.length, trend: pct(visitors.length, prevVisitors.length) },
  ];

  return {
    label: format(month, "MMMM yyyy"),
    isCurrentMonth: isSameMonth(month, new Date()),
    isLoading: currQuery.isLoading || prev.isLoading || visitorsQuery.isLoading,
    isFetching: currQuery.isFetching || prev.isFetching || visitorsQuery.isFetching,
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
