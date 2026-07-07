"use client";

import { useState } from "react";
import type { EventSummary } from "@/types";
import { showToast } from "@/components/ui/toast/toast";
import { submitEventRsvp, getRsvpErrorMessage } from "@/lib/api/events";
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

  // Logged-in members are registered immediately using their session details
  // — no navigation, no form. Signed-out visitors get the RSVP modal instead.
  async function handleRegisterClick() {
    if (registered) return;
    if (!isLoggedIn) {
      onNeedsRsvpModal();
      return;
    }
    setRegistering(true);
    try {
      await submitEventRsvp(event.slug, {
        fullName: user?.fullName?.trim() || "Member",
        email: user?.email?.trim() || "",
      });
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
