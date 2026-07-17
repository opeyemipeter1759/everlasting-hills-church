import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import type { EventDetail, EventRsvp } from "@/types";

export function useEventRsvps(id: string) {
  const qc = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ["event", id],
    queryFn: async () => (await apiClient.get<EventDetail>(`/events/admin/${id}`)).data,
  });

  const rsvpsQuery = useQuery({
    queryKey: ["event-rsvps", id],
    queryFn: async () => (await apiClient.get<EventRsvp[]>(`/events/admin/${id}/rsvps`)).data,
  });

  const checkIn = useMutation({
    mutationFn: ({ rsvpId, checkedIn }: { rsvpId: string; checkedIn: boolean }) =>
      apiClient.patch(`/events/admin/${id}/rsvps/${rsvpId}/check-in`, { checkedIn }),
    onSuccess: (_data, { checkedIn }) => {
      showToast.success(checkedIn ? "Marked present" : "Marked not present");
      qc.invalidateQueries({ queryKey: ["event-rsvps", id] });
    },
    onError: (err) => {
      showToast.error((err as { message?: string }).message ?? "Couldn't update check-in status");
    },
  });

  return {
    event: eventQuery.data,
    eventLoading: eventQuery.isLoading,
    eventError: eventQuery.error,
    rsvps: rsvpsQuery.data,
    rsvpsLoading: rsvpsQuery.isLoading,
    checkIn,
  };
}

export type CheckInMutation = ReturnType<typeof useEventRsvps>["checkIn"];
