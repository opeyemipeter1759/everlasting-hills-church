"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export type GiftEntryStatus = "INTERESTED" | "REJECTED";

/** GET /gift-exchange/me, and what register / withdraw answer with. */
export interface GiftExchangeMe {
  registered: boolean;
  status: GiftEntryStatus | null;
  rejectionReason: string | null;
  totalInterested: number;
  /** When the exchange begins, with its UTC offset. Only while the member is INTERESTED. */
  targetDate: string | null;
  serverTime: string;
}

/** The server's answer plus how far this device's clock is behind it (ms), measured when it arrived. */
export type GiftExchangeState = GiftExchangeMe & { clockOffsetMs: number };

export interface GiftEntry {
  id: string;
  memberId: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: GiftEntryStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface GiftEntriesResponse {
  /** When the exchange takes place, with its UTC offset. */
  targetDate: string;
  counts: { INTERESTED: number; REJECTED: number; total: number };
  entries: GiftEntry[];
}

const ROOT = ["gift-exchange"] as const;
const ME = [...ROOT, "me"] as const;

const withOffset = (me: GiftExchangeMe): GiftExchangeState => ({ ...me, clockOffsetMs: Date.parse(me.serverTime) - Date.now() });

export function useGiftExchange() {
  return useQuery({ queryKey: ME, queryFn: () => api.get<GiftExchangeMe>("/gift-exchange/me").then(withOffset) });
}

/** "I'm interested" (with no body); the answer replaces the card's state, so the countdown starts straight away. */
export function useRegisterGiftExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<GiftExchangeMe>("/gift-exchange/register").then(withOffset),
    onSuccess: (state) => qc.setQueryData(ME, state),
  });
}

export function useWithdrawGiftExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<GiftExchangeMe>("/gift-exchange/register").then(withOffset),
    onSuccess: (state) => qc.setQueryData(ME, state),
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useGiftEntries(status: GiftEntryStatus | null) {
  return useQuery({
    queryKey: [...ROOT, "entries", status ?? "all"],
    queryFn: () => api.get<GiftEntriesResponse>("/admin/gift-exchange/entries", status ? { status } : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useRejectGiftEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/admin/gift-exchange/entries/${encodeURIComponent(id)}/reject`, reason ? { reason } : {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  });
}

export function useReinstateGiftEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/gift-exchange/entries/${encodeURIComponent(id)}/reinstate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  });
}
