"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/** NOT_STARTED = not sent yet; CONFIRMED = sent to the Administrator. (AT_RISK is no longer set.) */
export type ReadinessState = "NOT_STARTED" | "CONFIRMED" | "AT_RISK";
export type ReadinessStatus = "READY" | "BLOCKED";

/** One thing a unit has to get done before the service. */
export interface ReadinessTask {
  id: string;
  title: string;
  done: boolean;
  /** Added by the Church Administrator rather than the unit. */
  byAdministrator: boolean;
}

export interface ReadinessUpdate {
  status: ReadinessStatus;
  note: string | null;
  by: string | null;
  createdAt: string;
}

/** A unit's plan for a service: its task list, where it stands, and its updates. */
export interface ReadinessPlan {
  state: ReadinessState;
  tasks: ReadinessTask[];
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
  /** The unit's task list from the last service of this kind, to copy. */
  previous: string[] | null;
}

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
