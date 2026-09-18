"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export type PledgeMethod = "ONE_TIME" | "WEEKLY" | "MONTHLY" | "OTHER";

export const PLEDGE_METHOD_LABEL: Record<PledgeMethod, string> = {
  ONE_TIME: "One-time payment",
  WEEKLY: "Weekly installments",
  MONTHLY: "Monthly installments",
  OTHER: "Other",
};

/** The Sound & Media Project appeal. The key is the API path segment. */
export const SOUND_MEDIA = { key: "sound-media", title: "Sound & Media Project" } as const;

/**
 * Where pledges to the project are remitted. The same account the API repeats
 * in every pledge email (PLEDGE_CAMPAIGNS in pledge.service.ts), and the
 * "Building / Project" line on the giving page.
 */
export const SOUND_MEDIA_ACCOUNT = {
  bank: "Globus Bank",
  purpose: "Building / Project",
  accountNumber: "2007060223",
  accountName: "EVERLASTING HEIGHTS MINISTRIES",
} as const;

export interface PledgeInput {
  fullName: string;
  phone: string;
  email: string;
  amount: number;
  method: PledgeMethod;
  methodOther?: string;
  installmentAmount?: number;
  completeBy: string;
  contactMe: boolean;
  confirmed: true;
}

export interface Pledge {
  id: string;
  memberId: string | null;
  fullName: string;
  phone: string;
  email: string;
  amount: number;
  method: PledgeMethod;
  methodOther: string | null;
  installmentAmount: number | null;
  completeBy: string;
  contactMe: boolean;
  installments: PledgeInstallment[];
  amountGiven: number;
  balance: number;
  progressPercent: number;
  /** Returned once, only when an anonymous public pledge is created. */
  trackingToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PledgeInstallment {
  id: string;
  amount: number;
  givenOn: string;
  note: string | null;
  createdAt: string;
}

export interface PledgeInstallmentInput {
  amount: number;
  givenOn: string;
  note?: string;
}

export interface PledgeList {
  campaign: { key: string; title: string };
  totals: { pledges: number; amount: number; amountGiven: number; balance: number; wantContact: number };
  pledges: Pledge[];
}

const numeric = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Older deployments returned pledges without installment progress fields.
 * Normalize every response at the API boundary so those records cannot crash
 * the member or administration screens during a rolling deployment.
 */
export function normalizePledge(raw: Pledge): Pledge {
  const installments = Array.isArray(raw.installments) ? raw.installments : [];
  const amount = numeric(raw.amount);
  const recordedTotal = installments.reduce((total, item) => total + numeric(item.amount), 0);
  const amountGiven = numeric(raw.amountGiven, recordedTotal);
  const balance = numeric(raw.balance, Math.max(amount - amountGiven, 0));
  const calculatedProgress = amount > 0 ? Math.min(100, Math.round((amountGiven / amount) * 100)) : 0;
  const progressPercent = Math.max(0, Math.min(100, numeric(raw.progressPercent, calculatedProgress)));

  return { ...raw, amount, installments, amountGiven, balance, progressPercent };
}

export function normalizePledgeList(raw: PledgeList): PledgeList {
  const pledges = Array.isArray(raw.pledges) ? raw.pledges.map(normalizePledge) : [];
  return {
    ...raw,
    pledges,
    totals: {
      pledges: pledges.length,
      amount: pledges.reduce((total, pledge) => total + pledge.amount, 0),
      amountGiven: pledges.reduce((total, pledge) => total + pledge.amountGiven, 0),
      balance: pledges.reduce((total, pledge) => total + pledge.balance, 0),
      wantContact: pledges.filter((pledge) => pledge.contactMe).length,
    },
  };
}

const mineKey = (campaign: string) => ["pledges", campaign, "mine"] as const;
const trackedKey = (campaign: string, token: string) => ["pledges", campaign, "track", token] as const;

/** The member's own pledge, or null before they pledge. */
export function useMyPledge(campaign: string = SOUND_MEDIA.key) {
  return useQuery({
    queryKey: mineKey(campaign),
    queryFn: async () => {
      const pledge = await api.get<Pledge | null>(`/pledges/${campaign}/mine`);
      return pledge ? normalizePledge(pledge) : null;
    },
  });
}

/**
 * Make a pledge. Dashboard submissions require membership; public submissions
 * work for everyone and are still linked when the visitor is signed in.
 */
export function useSubmitPledge(
  campaign: string = SOUND_MEDIA.key,
  access: "member" | "public" = "member",
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PledgeInput) =>
      normalizePledge(await api.post<Pledge>(
        access === "public" ? `/pledges/${campaign}/public` : `/pledges/${campaign}`,
        input,
      )),
    onSuccess: (pledge) => {
      // An anonymous public pledge must never be mistaken for the next member
      // who signs in on the same browser. Member pages fetch their own record.
      if (access === "member") qc.setQueryData(mineKey(campaign), pledge);
      qc.invalidateQueries({ queryKey: ["pledges", campaign, "all"] });
    },
  });
}

/** Every pledge to the appeal, for pastors and admins. */
export function usePledges(campaign: string = SOUND_MEDIA.key) {
  return useQuery({
    queryKey: ["pledges", campaign, "all"],
    queryFn: async () => normalizePledgeList(await api.get<PledgeList>(`/pledges/${campaign}`)),
  });
}

/**
 * Remove a pledge for good, with its recorded installments. Leaders only; the
 * member sees the appeal again as if they had never pledged.
 */
export function useDeletePledge(campaign: string = SOUND_MEDIA.key) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/pledges/${campaign}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pledges", campaign, "all"] });
    },
  });
}

/**
 * Emails a pledger their private tracking link again, for someone who pledged
 * without an account. The answer is the same whether or not that address has a
 * pledge, so nobody can use it to discover who gives.
 */
export function useRequestTrackingLink(campaign: string = SOUND_MEDIA.key) {
  return useMutation({
    mutationFn: (email: string) =>
      api.post<{ sent: boolean }>(`/pledges/${campaign}/track/resend`, { email }),
  });
}

/** Open the progress page associated with a private public tracking link. */
export function useTrackedPledge(token: string, campaign: string = SOUND_MEDIA.key) {
  return useQuery({
    queryKey: trackedKey(campaign, token),
    queryFn: async () => normalizePledge(
      await api.get<Pledge>(`/pledges/${campaign}/track/${encodeURIComponent(token)}`),
    ),
    enabled: Boolean(token),
  });
}

export type PledgeInstallmentTarget =
  | { access: "member" }
  | { access: "public"; token: string };

/** Record giving against either the signed-in member's pledge or a private public link. */
export function useAddPledgeInstallment(
  target: PledgeInstallmentTarget,
  campaign: string = SOUND_MEDIA.key,
) {
  const qc = useQueryClient();
  const endpoint = target.access === "member"
    ? `/pledges/${campaign}/mine/installments`
    : `/pledges/${campaign}/track/${encodeURIComponent(target.token)}/installments`;
  return useMutation({
    mutationFn: async (input: PledgeInstallmentInput) => normalizePledge(
      await api.post<Pledge>(endpoint, input),
    ),
    onSuccess: (pledge) => {
      if (target.access === "member") qc.setQueryData(mineKey(campaign), pledge);
      else qc.setQueryData(trackedKey(campaign, target.token), pledge);
      qc.invalidateQueries({ queryKey: ["pledges", campaign, "all"] });
    },
  });
}

export const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);

export function pledgePlan(pledge: Pick<Pledge, "method" | "methodOther" | "installmentAmount">) {
  if (pledge.method === "OTHER") return pledge.methodOther || PLEDGE_METHOD_LABEL.OTHER;
  if (pledge.installmentAmount) {
    return `${PLEDGE_METHOD_LABEL[pledge.method]} of ${formatNaira(pledge.installmentAmount)}`;
  }
  return PLEDGE_METHOD_LABEL[pledge.method];
}
