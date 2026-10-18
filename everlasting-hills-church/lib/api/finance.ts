"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

// ── Types ────────────────────────────────────────────────────────────────────

export type FinanceEntryKind = "INCOME" | "EXPENSE";

export interface ServiceWithOffering {
  id: string;
  name: string;
  scheduledAt: string;
  ServiceOffering: {
    id: string;
    tithe: number;
    offering: number;
    note: string | null;
    recordedAt: string;
  } | null;
}

export interface UpsertServiceOfferingInput {
  tithe: number;
  offering: number;
  note?: string;
}

export interface FinanceEntry {
  id: string;
  kind: FinanceEntryKind;
  category: string;
  label: string | null;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinanceEntryInput {
  kind: FinanceEntryKind;
  category: string;
  label?: string;
  amount: number;
  date: string;
  note?: string;
}

export type UpdateFinanceEntryInput = Partial<Omit<CreateFinanceEntryInput, "kind">>;

export interface FinanceSummary {
  range: { from: string; to: string };
  services: {
    id: string;
    name: string;
    scheduledAt: string;
    tithe: number | null;
    offering: number | null;
    recorded: boolean;
  }[];
  titheTotal: number;
  offeringTotal: number;
  incomeByCategory: { category: string; amount: number }[];
  incomeTotal: number;
  expenseByCategory: { category: string; amount: number }[];
  expenseTotal: number;
  grandIncomeTotal: number;
  netTotal: number;
}

export const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);

const FINANCE_KEY = ["finance"] as const;

function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: FINANCE_KEY });
}

// ── Service offerings ───────────────────────────────────────────────────────

export function useServicesWithOfferings(params: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "services", params],
    queryFn: () => api.get<ServiceWithOffering[]>("/finance/services", params),
  });
}

export function useUpsertServiceOffering() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: UpsertServiceOfferingInput }) =>
      api.post(`/finance/service-offerings/${serviceId}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteServiceOffering() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (serviceId: string) => api.delete(`/finance/service-offerings/${serviceId}`),
    onSuccess: invalidate,
  });
}

// ── Income / expense entries ────────────────────────────────────────────────

export function useFinanceEntries(params: { from?: string; to?: string; kind?: FinanceEntryKind } = {}) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "entries", params],
    queryFn: () => api.get<FinanceEntry[]>("/finance/entries", params),
  });
}

export function useCreateFinanceEntry() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (data: CreateFinanceEntryInput) => api.post<FinanceEntry>("/finance/entries", data),
    onSuccess: invalidate,
  });
}

export function useUpdateFinanceEntry() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFinanceEntryInput }) =>
      api.patch<FinanceEntry>(`/finance/entries/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteFinanceEntry() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/finance/entries/${id}`),
    onSuccess: invalidate,
  });
}

// ── Summaries ────────────────────────────────────────────────────────────────

export function useDailyFinanceSummary(date: string) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "summary", "daily", date],
    queryFn: () => api.get<FinanceSummary>("/finance/summary/daily", { date }),
    enabled: Boolean(date),
  });
}

export function useWeeklyFinanceSummary(date: string) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "summary", "weekly", date],
    queryFn: () => api.get<FinanceSummary>("/finance/summary/weekly", { date }),
    enabled: Boolean(date),
  });
}

export function useMonthlyFinanceSummary(year: number, month: number) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "summary", "monthly", year, month],
    queryFn: () => api.get<FinanceSummary>("/finance/summary/monthly", { year, month }),
    enabled: Boolean(year && month),
  });
}
