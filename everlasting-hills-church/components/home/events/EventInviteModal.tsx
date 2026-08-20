"use client";

import { Share2 } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import type { EventSummary } from "@/types";
import { formatEventDateRange } from "@/components/events/detail/event-format";
import { useEventShare } from "./useEventShare";
import WhatsAppIcon from "./WhatsAppIcon";

interface EventInviteModalProps {
  event: EventSummary;
  onClose: () => void;
}

/** Shown once someone's already registered — a bigger, clearer surface for the same
 * share actions the small icon buttons on the ticket card already offer. */
export default function EventInviteModal({ event, onClose }: EventInviteModalProps) {
  const href = event.customPath ?? `/events/${event.slug}`;
  const dateLabel = formatEventDateRange(event.startAt, event.endAt);
  const { copied, handleShareLink, handleWhatsApp } = useEventShare(event, href, dateLabel);

  return (
    <Modal open onClose={onClose} title="Invite a friend" description={event.title} maxWidth="sm">
      <div className="space-y-3">
        <p className="text-sm text-[#555]">You&apos;re all set! Bring someone along — share the invite below.</p>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold text-white transition-all hover:brightness-95"
        >
          <WhatsAppIcon />
          Share on WhatsApp
        </button>

        <button
          type="button"
          onClick={handleShareLink}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E7CDD3] py-3 text-sm font-bold text-[#87102C] transition-all hover:bg-[#FFF4F6]"
        >
          <Share2 size={15} />
          {copied ? "Link copied!" : "Copy invite link"}
        </button>
      </div>
    </Modal>
  );
}
