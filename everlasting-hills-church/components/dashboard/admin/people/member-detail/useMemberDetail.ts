import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { MemberDetail } from "./types";

export function useMemberDetail(id: string) {
  return useQuery({
    queryKey: ["member", id],
    queryFn: () => api.get<MemberDetail>(`/members/${id}`),
  });
}
