"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useSendUnitMessage } from "@/lib/api";
import { showToast } from "@/components/ui/toast/toast";
import FormModal, { btnGhost, btnPrimary, fieldCls } from "@/components/ui/overlay/FormModal";

interface Recipient {
  id: string;
  name: string;
  photoUrl: string | null;
}

/**
 * Compose a message to one member of the unit. If `recipient` is fixed (opened
 * from a roster row) the "To" field is locked to that person; if `recipients`
 * is a list (opened from a general "Message someone" action) the sender picks
 * from a dropdown.
 */
export default function MessageMemberModal({
  unitId,
  recipient,
  recipients,
  onClose,
}: {
  unitId: string;
  recipient?: Recipient;
  recipients?: Recipient[];
  onClose: () => void;
}) {
  const [recipientId, setRecipientId] = useState(recipient?.id ?? "");
  const [message, setMessage] = useState("");
  const send = useSendUnitMessage();

  const open = Boolean(recipient) || Boolean(recipients);

  async function handleSend() {
    if (!recipientId || !message.trim()) return;
    try {
      await send.mutateAsync({ unitId, recipientId, message: message.trim() });
      showToast.success("Message sent");
      onClose();
    } catch (err) {
      showToast.error((err as { message?: string })?.message ?? "Couldn't send message");
    }
  }

  const toName = recipient?.name ?? recipients?.find((r) => r.id === recipientId)?.name;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Send a message"
      subtitle={recipient ? `To ${recipient.name}` : "Pick someone in your unit to message."}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={!recipientId || !message.trim() || send.isPending}
            onClick={handleSend}
          >
            <Send size={14} />
            {send.isPending ? "Sending…" : "Send"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {!recipient && recipients && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">To</label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className={fieldCls}
            >
              <option value="">Choose a member…</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">
            Message{toName && !recipient ? ` to ${toName}` : ""}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message…"
            rows={4}
            maxLength={1000}
            className={`${fieldCls} resize-none`}
          />
        </div>
      </div>
    </FormModal>
  );
}
