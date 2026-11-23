"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export type GiftEntryStatus = "INTERESTED" | "REJECTED";
export type GiftActivity = "GIFT_EXCHANGE" | "PICNIC";

/** What a member signs up for: either or both. */
export interface GiftChoice {
  giftExchange: boolean;
  picnic: boolean;
}

/** GET /gift-exchange/me, and what register / withdraw answer with. */
export interface GiftExchangeMe extends GiftChoice {
  registered: boolean;
  status: GiftEntryStatus | null;
  rejectionReason: string | null;
  totalInterested: number;
  /** When it begins (Lagos time, with its UTC offset). Sent even before joining; the countdown shows only once in. */
  targetDate: string | null;
  serverTime: string;
}

/** The server's answer plus how far this device's clock is behind it (ms), measured when it arrived. */
export type GiftExchangeState = GiftExchangeMe & { clockOffsetMs: number };

export interface GiftEntry extends GiftChoice {
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
  /** giftExchange / picnic count only people still in (not rejected). */
  counts: { INTERESTED: number; REJECTED: number; total: number; giftExchange: number; picnic: number };
  entries: GiftEntry[];
}

const ROOT = ["gift-exchange"] as const;
const ME = [...ROOT, "me"] as const;

const withOffset = (me: GiftExchangeMe): GiftExchangeState => ({ ...me, clockOffsetMs: Date.parse(me.serverTime) - Date.now() });

export function useGiftExchange() {
  return useQuery({ queryKey: ME, queryFn: () => api.get<GiftExchangeMe>("/gift-exchange/me").then(withOffset) });
}

/** Join, or change what you joined; the answer replaces the card's state, so the countdown starts straight away. */
export function useRegisterGiftExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (choice: GiftChoice) => api.post<GiftExchangeMe>("/gift-exchange/register", choice).then(withOffset),
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

export interface GiftEntriesFilter {
  status?: GiftEntryStatus;
  activity?: GiftActivity;
}

export function useGiftEntries(filter: GiftEntriesFilter) {
  return useQuery({
    queryKey: [...ROOT, "entries", filter.status ?? "any", filter.activity ?? "any"],
    queryFn: () =>
      api.get<GiftEntriesResponse>("/admin/gift-exchange/entries", {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.activity ? { activity: filter.activity } : {}),
      }),
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
