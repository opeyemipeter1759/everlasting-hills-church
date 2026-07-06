"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

export type ServiceTypeKey = "SUNDAY" | "WEDNESDAY" | "SPECIAL";
export type ServiceState = "SCHEDULED" | "LIVE" | "ENDED";
export type HeadcountStatus = "DRAFT" | "CONFIRMED";

export interface HeadcountVariance {
  hasVariance: boolean;
  reportedTotal: number;
  computedTotal: number;
  delta: number;
}

export interface Headcount {
  id: string;
  serviceId: string;
  men: number;
  women: number;
  boys: number;
  girls: number;
  children: number; // derived = boys + girls
  firstTimers: number;
  total: number; // = men + women + boys + girls (first-timers NOT added)
  reportedTotal: number | null;
  notes: string | null;
  status: HeadcountStatus;
  recordedBy: string | null;
  recordedAt: string;
  updatedAt: string;
  edited: boolean;
  variance: HeadcountVariance | null;
}

export interface HeadcountServiceInfo {
  id: string;
  name: string;
  serviceType: ServiceTypeKey;
  scheduledAt: string;
  state: ServiceState;
}

export interface ServiceHeadcountResponse {
  service: HeadcountServiceInfo;
  canRecord: boolean;
  headcount: Headcount | null;
}

export interface HeadcountByDateResponse {
  date: string;
  inferredType: ServiceTypeKey;
  canRecord: boolean;
  service: HeadcountServiceInfo | null;
  headcount: Headcount | null;
}

export interface HeadcountHistoryRow extends Headcount {
  serviceName: string;
  serviceType: ServiceTypeKey;
  serviceDate: string;
}

export interface TodayHeadcount {
  total: number | null;
  headcount: Headcount | null;
}

export interface HeadcountTrendPoint {
  id: string;
  serviceType: ServiceTypeKey;
  date: string;
  label: string;
  value: number;
  men: number;
  women: number;
  children: number;
  firstTimers: number;
}

export interface SaveHeadcountInput {
  men: number;
  women: number;
  boys: number;
  girls: number;
  firstTimers: number;
  reportedTotal?: number | null;
  notes?: string | null;
  confirm?: boolean;
}

// ── Hooks ────────────────────────────────────────────────────────────────────

const KEY = ["headcount"] as const;

export function useServiceHeadcount(serviceId: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "service", serviceId],
    queryFn: () => api.get<ServiceHeadcountResponse>(`/headcount/service/${serviceId}`),
    enabled: Boolean(serviceId),
  });
}

export function useHeadcountByDate(date: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "by-date", date],
    queryFn: () => api.get<HeadcountByDateResponse>(`/headcount/by-date?date=${date}`),
    enabled: Boolean(date),
  });
}

export function useSaveHeadcountByDate(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveHeadcountInput) => api.put<Headcount>(`/headcount/by-date?date=${encodeURIComponent(date)}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useHeadcountHistory(limit = 30) {
  return useQuery({
    queryKey: [...KEY, "history", limit],
    queryFn: () => api.get<HeadcountHistoryRow[]>(`/headcount/history?limit=${limit}`),
  });
}

export function useTodayHeadcount() {
  return useQuery({
    queryKey: [...KEY, "today"],
    queryFn: () => api.get<TodayHeadcount>("/headcount/today"),
    enabled: typeof window !== "undefined",
  });
}

export function useHeadcountTrend(serviceType?: ServiceTypeKey, limit = 24) {
  return useQuery({
    queryKey: [...KEY, "trend", serviceType ?? "ALL", limit],
    queryFn: () =>
      api.get<HeadcountTrendPoint[]>(
        `/headcount/trend?limit=${limit}${serviceType ? `&serviceType=${serviceType}` : ""}`,
      ),
  });
}

export function useSaveHeadcount(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SaveHeadcountInput) => api.put<Headcount>(`/headcount/service/${serviceId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      // Congregation stats + growth chart now read from headcount.
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

// ── Lightweight services list (for choosing the service to count) ─────────────

export interface AttendanceServiceRow {
  id: string;
  name: string;
  serviceType: ServiceTypeKey;
  scheduledAt: string;
  isOpen: boolean;
}

export function useAttendanceServices() {
  return useQuery({
    queryKey: ["attendance", "services", "list"],
    queryFn: () => api.get<AttendanceServiceRow[]>("/attendance/services"),
  });
}
