"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/**
 * The serving roster, one row per person.
 *
 * Read-only. Adding and removing people goes through the unit endpoints in
 * lib/api/people.ts, which are the same ones a unit lead's own roster uses —
 * there is one way to put somebody on a team, and this screen is a caller of it
 * rather than a second implementation.
 */

export type TeamRole = "LEAD" | "ASSISTANT" | "MEMBER";

export interface ServiceTeamMembership {
  membershipId: string;
  unitId: string;
  unitName: string;
  departmentId: string | null;
  departmentName: string | null;
  isLead: boolean;
  isAssistant: boolean;
  positionId: string | null;
  positionName: string | null;
  joinedAt: string;
  /** Whether this particular team is why the person matched the filter. */
  matchesFilter: boolean;
}

export interface ServiceTeamPerson {
  memberId: string;
  profileId: string | null;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  status: string;
  joinedAt: string;
  teams: ServiceTeamMembership[];
  teamCount: number;
  leadsCount: number;
}

export interface ServiceTeamSummary {
  id: string;
  name: string;
  departmentId: string | null;
  departmentName: string | null;
  memberCount: number;
  hasLead: boolean;
}

export interface ServiceTeamStats {
  serving: number;
  activeMembers: number;
  notServing: number;
  teamCount: number;
  teamsWithoutLead: number;
  servingInMoreThanOne: number;
  matched: number;
}

export interface ServiceTeamRoster {
  people: ServiceTeamPerson[];
  teams: ServiceTeamSummary[];
  stats: ServiceTeamStats;
}

export interface ServiceTeamFilters {
  search?: string;
  departmentId?: string;
  unitId?: string;
  role?: TeamRole | "";
  status?: string;
}

export function useServiceTeamRoster(filters: ServiceTeamFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.departmentId) params.set("departmentId", filters.departmentId);
  if (filters.unitId) params.set("unitId", filters.unitId);
  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();

  return useQuery({
    queryKey: ["service-teams", "roster", qs],
    queryFn: () => api.get<ServiceTeamRoster>(`/service-teams${qs ? `?${qs}` : ""}`),
  });
}

/** "Lead", "Assistant", or the named position if one is set. */
export function roleLabel(team: ServiceTeamMembership): string {
  if (team.isLead) return "Lead";
  if (team.isAssistant) return "Assistant";
  return team.positionName ?? "Member";
}

/**
 * The roster keyed by team rather than by person, for the by-team view.
 *
 * Derived on the client from the same payload: the server already sent every
 * membership, and asking for it a second time grouped differently would be a
 * second query that could disagree with the first.
 */
export interface TeamGroup {
  team: ServiceTeamSummary;
  members: { person: ServiceTeamPerson; membership: ServiceTeamMembership }[];
}

export function groupByTeam(roster: ServiceTeamRoster | undefined): TeamGroup[] {
  // A plain record rather than a Map: this package targets ES5, where iterating
  // a Map needs downlevelIteration, and the keys here are unit ids anyway.
  const byTeam: Record<string, TeamGroup> = {};
  const order: string[] = [];

  for (const team of roster?.teams ?? []) {
    byTeam[team.id] = { team, members: [] };
    order.push(team.id);
  }

  for (const person of roster?.people ?? []) {
    for (const membership of person.teams) {
      const entry = byTeam[membership.unitId];
      if (entry) entry.members.push({ person, membership });
    }
  }

  const rank = (m: ServiceTeamMembership) => (m.isLead ? 0 : m.isAssistant ? 1 : 2);

  return order.map((id) => {
    const entry = byTeam[id];
    // Leads first within a team, then alphabetically — the roster reads the way
    // somebody would introduce the team out loud.
    entry.members.sort((a, b) => {
      const diff = rank(a.membership) - rank(b.membership);
      return diff !== 0 ? diff : a.person.name.localeCompare(b.person.name);
    });
    return entry;
  });
}

export function serviceTeamCsv(roster: ServiceTeamRoster): string {
  const header = ["Name", "Email", "Phone", "Status", "Team", "Department", "Role", "Joined team"];
  const rows: string[][] = [];

  for (const person of roster.people) {
    for (const team of person.teams) {
      rows.push([
        person.name,
        person.email ?? "",
        person.phone ?? "",
        person.status,
        team.unitName,
        team.departmentName ?? "",
        roleLabel(team),
        team.joinedAt ? new Date(team.joinedAt).toLocaleDateString("en-GB") : "",
      ]);
    }
  }

  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}
