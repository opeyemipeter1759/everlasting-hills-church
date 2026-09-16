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

const mineKey = (campaign: string) => ["pledges", campaign, "mine"] as const;
const trackedKey = (campaign: string, token: string) => ["pledges", campaign, "track", token] as const;

/** The member's own pledge, or null before they pledge. */
export function useMyPledge(campaign: string = SOUND_MEDIA.key) {
  return useQuery({
    queryKey: mineKey(campaign),
    queryFn: () => api.get<Pledge | null>(`/pledges/${campaign}/mine`),
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
    mutationFn: (input: PledgeInput) =>
      api.post<Pledge>(
        access === "public" ? `/pledges/${campaign}/public` : `/pledges/${campaign}`,
        input,
      ),
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
    queryFn: () => api.get<PledgeList>(`/pledges/${campaign}`),
  });
}

/** Open the progress page associated with a private public tracking link. */
export function useTrackedPledge(token: string, campaign: string = SOUND_MEDIA.key) {
  return useQuery({
    queryKey: trackedKey(campaign, token),
    queryFn: () => api.get<Pledge>(`/pledges/${campaign}/track/${encodeURIComponent(token)}`),
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
    mutationFn: (input: PledgeInstallmentInput) => api.post<Pledge>(endpoint, input),
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
