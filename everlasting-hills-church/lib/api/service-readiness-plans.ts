"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/** NOT_STARTED = not submitted; CONFIRMED = submitted. (AT_RISK is no longer set.) */
export type ReadinessState = "NOT_STARTED" | "CONFIRMED" | "AT_RISK";
export type ReadinessStatus = "READY" | "BLOCKED";

/** A unit's Stage 1 plan, in the manual's order. */
export interface ReadinessPlanFields {
  workers: string | null;
  equipment: string | null;
  done: string | null;
  outstanding: string | null;
  challenges: string | null;
  support: string | null;
}

export interface ReadinessUpdate {
  status: ReadinessStatus;
  note: string | null;
  by: string | null;
  createdAt: string;
}

export interface ReadinessPlan extends ReadinessPlanFields {
  state: ReadinessState;
  canMeetDeadline: boolean | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  /** The unit's latest update; null until it posts one. */
  status: ReadinessStatus | null;
  blocker: string | null;
  statusUpdatedAt: string | null;
  updates: ReadinessUpdate[];
}

export interface ReadinessServiceRef {
  id: string;
  name: string;
  serviceType: "SUNDAY" | "WEDNESDAY";
  scheduledAt: string;
  readyBy: string | null;
  planDue: string | null;
  /** The day-before and 2-hours-before inspection times. */
  inspections: Record<InspectionRound, string> | null;
}

export type InspectionRound = "DAY_BEFORE" | "ON_THE_DAY";
export type InspectionResult = "READY" | "ISSUES";

export interface BoardRow extends ReadinessPlan {
  unitId: string;
  unitName: string;
  department: string | null;
  overdue: boolean;
  inspections: Record<InspectionRound, InspectionResult | null>;
}

export interface ReadinessBoard {
  services: ReadinessServiceRef[];
  selectedId: string | null;
  rows: BoardRow[];
}

export interface MyReadinessItem {
  service: ReadinessServiceRef;
  unit: { id: string; name: string };
  plan: ReadinessPlan;
  /** Who is on this service's roster for the unit: "Ada Obi (Camera)". */
  roster: string[];
  /** The unit's plan for the last service of this kind, to start from. */
  previous: ReadinessPlanFields | null;
}

export type PlanInput = Partial<Record<keyof ReadinessPlanFields, string>>;

/** The Church Administrator's board for the next (or a chosen) service. Refreshes every minute. */
export function useReadinessBoard(serviceId: string | null) {
  return useQuery({
    queryKey: ["service-readiness", "board", serviceId ?? "next"],
    queryFn: () => api.get<ReadinessBoard>("/service-readiness/board", serviceId ? { serviceId } : undefined),
    refetchInterval: 60_000,
  });
}

/** The units this person leads, for the coming Sunday and Wednesday. */
export function useMyReadiness() {
  return useQuery({
    queryKey: ["service-readiness", "mine"],
    queryFn: () => api.get<{ items: MyReadinessItem[] }>("/service-readiness/mine"),
  });
}
