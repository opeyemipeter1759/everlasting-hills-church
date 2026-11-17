"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { useSendOpeningEmail, type EmailResult } from "@/lib/api/opening-message";

const RESULT_TEXT: Record<EmailResult["status"], (name: string) => string> = {
  SENT: (name) => `Email sent to ${name}`,
  SKIPPED: () => "Today's email allowance is used up. Send on WhatsApp, or try again tomorrow.",
  FAILED: (name) => `The email to ${name} did not go through. Try again a little later.`,
  NO_EMAIL: (name) => `${name} did not give an email address.`,
};

/** Emails the opening message to one first-timer, after a check, since an email cannot be taken back. */
export function EmailSendButton({
  visitorId,
  firstName,
  to,
  emailsLeftToday,
  onSent,
}: {
  visitorId: string;
  firstName: string;
  to: string;
  emailsLeftToday: number | null;
  onSent: () => void;
}) {
  const send = useSendOpeningEmail();
  const [open, setOpen] = useState(false);
  const left = emailsLeftToday ?? 0;

  async function confirm() {
    try {
      const result = await send.mutateAsync(visitorId);
      const text = RESULT_TEXT[result.status](firstName);
      if (result.status === "SENT") showToast.success(text);
      else showToast.error(text);
      setOpen(false);
      onSent();
    } catch (err) {
      showToast.error((err as ApiError)?.message || `Could not email ${firstName}`);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={left === 0}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:text-white/85 dark:hover:bg-white/10"
      >
        <Mail size={16} aria-hidden="true" />
        {left === 0 ? "No emails left today" : "Send email"}
      </button>
      <ConfirmDialog
        open={open}
        title={`Email ${firstName} now?`}
        description={`The opening message goes to ${to}. You can send ${left} more ${left === 1 ? "email" : "emails"} today.`}
        confirmLabel="Send email"
        tone="info"
        loading={send.isPending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
