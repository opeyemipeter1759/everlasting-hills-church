"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { showToast } from "@/components/ui/toast/toast";
import { submitEventRsvp, getRsvpErrorMessage } from "@/lib/api/events";
import type { EventSummary } from "@/types";
import type { RegisteredEvents } from "./useEventRegistration";

interface EventRsvpModalProps {
  event: EventSummary;
  onClose: () => void;
  registeredEvents: RegisteredEvents;
}

/** RSVP for anonymous visitors — one seat per person, no attendee count. */
export default function EventRsvpModal({ event, onClose, registeredEvents }: EventRsvpModalProps) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitEventRsvp(event.slug, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
      });
      showToast.success("You're registered! See you there.");
      registeredEvents.markRegistered(event.id);
      onClose();
    } catch (err) {
      showToast.error(getRsvpErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Reserve your seat" description={event.title} maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="modal-rsvp-name">
          <input
            id="modal-rsvp-name"
            type="text"
            required
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Jane Doe"
            className={inputClass}
          />
        </Field>
        <Field label="Email address" htmlFor="modal-rsvp-email">
          <input
            id="modal-rsvp-email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </Field>
        <Field label="Phone number (optional)" htmlFor="modal-rsvp-phone">
          <input
            id="modal-rsvp-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+234 801 234 5678"
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#87102C] py-3 text-sm font-bold text-white transition-all hover:bg-[#6E0C24] hover:shadow-lg hover:shadow-[#87102C]/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Registering…
            </>
          ) : (
            <>
              <Send size={15} />
              Reserve My Seat
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-[#E7CDD3] bg-[#FFF4F6]/40 text-[#111] text-sm placeholder:text-[#aaa] focus:outline-none focus:border-[#87102C] focus:bg-white focus-visible:ring-4 focus-visible:ring-[#87102C]/15 transition-all";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold tracking-wide text-[#444]">
        {label}
      </label>
      {children}
    </div>
  );
}
