"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/** Someone who asked, on the first-timer form, to join the church WhatsApp community. */
export interface WhatsappCommunityPerson {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  submittedAt: string;
  whatsappAddedAt: string | null;
}

export interface WhatsappCommunityList {
  /** Still to be added, longest wait first. */
  waiting: WhatsappCommunityPerson[];
  /** The last twenty added, newest first; only fetched when asked for. */
  added: WhatsappCommunityPerson[];
}

const key = (includeAdded: boolean) => ["visitors", "whatsapp-community", includeAdded] as const;

export function useWhatsappCommunity(includeAdded = false) {
  return useQuery({
    queryKey: key(includeAdded),
    queryFn: () =>
      api.get<WhatsappCommunityList>(
        `/visitors/whatsapp-community${includeAdded ? "?includeAdded=true" : ""}`,
      ),
  });
}

/** Records that a person is now in the community, or puts them back on the list. */
export function useMarkWhatsappAdded() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, added }: { id: string; added: boolean }) =>
      api.patch<{ id: string; added: boolean }>(`/visitors/${id}/whatsapp-community`, { added }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitors", "whatsapp-community"] }),
  });
}

/** wa.me wants the international number without the plus. */
export function whatsappChatLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `https://wa.me/${digits.startsWith("0") ? `234${digits.slice(1)}` : digits}`;
}
