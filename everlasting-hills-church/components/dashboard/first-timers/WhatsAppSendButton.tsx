"use client";

import { MessageCircle } from "lucide-react";
import { useLogWhatsAppSend, type OpeningWhatsApp } from "@/lib/api/opening-message";
import { showToast } from "@/components/ui/toast/toast";

/**
 * Opens the opening message in the sender's own WhatsApp, already written,
 * and logs the send as she taps. The message comes from her, so nothing needs
 * Meta's approval and it costs nothing.
 */
export function WhatsAppSendButton({
  visitorId,
  firstName,
  whatsapp,
  onLogged,
  compact = false,
}: {
  visitorId: string;
  firstName: string;
  whatsapp: OpeningWhatsApp;
  onLogged?: () => void;
  compact?: boolean;
}) {
  const log = useLogWhatsAppSend();

  function logSend() {
    log.mutate(
      { visitorId, templateVersion: whatsapp.templateVersion },
      {
        onSuccess: () => {
          showToast.success(`Logged your message to ${firstName}`);
          onLogged?.();
        },
        onError: () => showToast.error(`WhatsApp opened, but the send to ${firstName} was not logged. Open their profile and tap Send on WhatsApp again.`),
      },
    );
  }

  return (
    <a
      href={whatsapp.link}
      target="_blank"
      rel="noreferrer"
      onClick={logSend}
      aria-label={`Send ${firstName} the opening message on WhatsApp`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
        compact ? "min-h-[36px] px-3 text-xs" : "min-h-[44px] px-4 text-sm"
      }`}
    >
      <MessageCircle size={compact ? 14 : 16} aria-hidden="true" />
      Send on WhatsApp
    </a>
  );
}
