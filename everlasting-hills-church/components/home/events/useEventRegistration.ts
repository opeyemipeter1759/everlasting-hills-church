"use client";

import { useState } from "react";
import type { EventSummary } from "@/types";
import { showToast } from "@/components/ui/toast/toast";
import { submitMemberEventRsvp, getRsvpErrorMessage } from "@/lib/api/events";
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

  const registered = registeredEvents.isRegistered(event.id);

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
    } catch (err) {
      showToast.error(getRsvpErrorMessage(err));
    } finally {
      setRegistering(false);
    }
  }

  return { registering, registered, handleRegisterClick };
}
