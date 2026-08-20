"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventSummary } from "@/types";
import { showToast } from "@/components/ui/toast/toast";
import { submitMemberEventRsvp, getMyEventRsvpStatus, getRsvpErrorMessage } from "@/lib/api/events";
import { useCurrentUser } from "@/hooks";

export interface RegisteredEvents {
  isRegistered: (eventId: string) => boolean;
  markRegistered: (eventId: string) => void;
}

export function useEventRegistration(
  event: EventSummary,
  onNeedsRsvpModal: () => void,
  registeredEvents: RegisteredEvents
) {
  const user = useCurrentUser();
  const isLoggedIn = !!user?.loggedIn;
  const [registering, setRegistering] = useState(false);
  const queryClient = useQueryClient();

  // Signed-in members: "registered" always comes from the backend, not browser storage —
  // otherwise a new device or a cleared cache would wrongly show "Register" again for
  // someone who already RSVP'd. Signed-out visitors have no account to check against, so
  // they keep the local (per-browser) flag set by the RSVP modal.
  const rsvpStatusKey = ["events", event.slug, "rsvp-status"] as const;
  const rsvpStatus = useQuery({
    queryKey: rsvpStatusKey,
    queryFn: () => getMyEventRsvpStatus(event.slug),
    enabled: isLoggedIn,
  });

  const registered = isLoggedIn ? !!rsvpStatus.data?.registered : registeredEvents.isRegistered(event.id);

  // Logged-in members are registered immediately — the backend looks up their name/email/phone
  // from their own Member record, no form. Signed-out visitors get the RSVP modal instead.
  async function handleRegisterClick() {
    if (registered) return;
    if (!isLoggedIn) {
      onNeedsRsvpModal();
      return;
    }
    setRegistering(true);
    try {
      await submitMemberEventRsvp(event.slug);
      showToast.success("You're registered! See you there.");
      registeredEvents.markRegistered(event.id);
      queryClient.invalidateQueries({ queryKey: rsvpStatusKey });
    } catch (err) {
      showToast.error(getRsvpErrorMessage(err));
    } finally {
      setRegistering(false);
    }
  }

  return { registering, registered, handleRegisterClick };
}
