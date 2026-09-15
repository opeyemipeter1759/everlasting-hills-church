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
  createdAt: string;
  updatedAt: string;
}

export interface PledgeList {
  campaign: { key: string; title: string };
  totals: { pledges: number; amount: number; wantContact: number };
  pledges: Pledge[];
}

const mineKey = (campaign: string) => ["pledges", campaign, "mine"] as const;

/** The member's own pledge, or null before they pledge. */
export function useMyPledge(campaign: string = SOUND_MEDIA.key) {
  return useQuery({
    queryKey: mineKey(campaign),
    queryFn: () => api.get<Pledge | null>(`/pledges/${campaign}/mine`),
  });
}

/** Make or update the member's pledge; pledging again replaces the last one. */
export function useSubmitPledge(campaign: string = SOUND_MEDIA.key) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PledgeInput) => api.post<Pledge>(`/pledges/${campaign}`, input),
    onSuccess: (pledge) => {
      qc.setQueryData(mineKey(campaign), pledge);
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

export const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);

export function pledgePlan(pledge: Pick<Pledge, "method" | "methodOther" | "installmentAmount">) {
  if (pledge.method === "OTHER") return pledge.methodOther || PLEDGE_METHOD_LABEL.OTHER;
  if (pledge.installmentAmount) {
    return `${PLEDGE_METHOD_LABEL[pledge.method]} of ${formatNaira(pledge.installmentAmount)}`;
  }
  return PLEDGE_METHOD_LABEL[pledge.method];
}
