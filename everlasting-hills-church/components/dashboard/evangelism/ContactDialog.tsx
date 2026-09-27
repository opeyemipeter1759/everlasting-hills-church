"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/overlay/Modal";
import { showToast } from "@/components/ui/toast/toast";
import {
  useCreateContact,
  useEvangelismTeam,
  useOutreaches,
  useUpdateContact,
  type ContactDetail,
} from "@/lib/api/evangelism";
import { ContactFields } from "./ContactFields";
import { contactInput, emptyContactForm, formFromContact, validateContactForm, type ContactFormErrors, type ContactFormState } from "./contact-form";
import { primaryButton, secondaryButton } from "./bits";
import { errorText } from "./labels";

/** Add a contact from the dashboard, or (leaders) edit one. */
export function ContactDialog({
  open,
  onClose,
  contact,
  defaultWorkerId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  contact?: ContactDetail | null;
  defaultWorkerId?: string | null;
  onCreated?: (id: string) => void;
}) {
  const team = useEvangelismTeam(open);
  const outreaches = useOutreaches();
  const create = useCreateContact();
  const update = useUpdateContact();
  const [form, setForm] = useState<ContactFormState>(() => emptyContactForm());
  const [errors, setErrors] = useState<ContactFormErrors>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(contact ? formFromContact(contact) : emptyContactForm({ workerId: defaultWorkerId ?? "" }));
  }, [open, contact, defaultWorkerId]);

  const workers = team.data ?? [];
  // Someone who has left the team still shows as the worker on their old records.
  const workerOptions =
    contact?.worker.id && !workers.some((w) => w.id === contact.worker.id)
      ? [...workers, { id: contact.worker.id, name: contact.worker.name }]
      : workers;
  const activeOutreaches = (outreaches.data?.outreaches ?? []).filter((o) => o.active || o.id === contact?.outreach?.id);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const found = validateContactForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    const input = contactInput(form);
    try {
      if (contact) {
        // Resend the date only when it was changed: a date on its own would
        // move the time of contact and restart the 30-day window.
        const { contactDate, ...rest } = input;
        const dateChanged = contactDate !== formFromContact(contact).contactDate;
        await update.mutateAsync({
          id: contact.id,
          ...rest,
          ...(dateChanged ? { contactDate } : {}),
          school: input.school ?? null,
          level: input.level ?? null,
          discussion: input.discussion ?? null,
          outreachId: input.outreachId ?? null,
          workerMemberId: input.workerMemberId ?? null,
          nextAction: input.nextAction ?? null,
        });
        showToast.success("Contact updated");
      } else {
        const res = await create.mutateAsync(input);
        showToast.success(`${input.name} added`);
        onCreated?.(res.id);
      }
      onClose();
    } catch (err) {
      showToast.error(errorText(err, "Couldn't save"));
    }
  }

  const busy = create.isPending || update.isPending;
  return (
    <Modal open={open} onClose={onClose} title={contact ? `Edit ${contact.name}` : "Add a contact"} maxWidth="lg">
      <form onSubmit={save} noValidate className="space-y-5">
        <ContactFields
          value={form}
          onChange={setForm}
          errors={errors}
          workers={workerOptions}
          outreaches={activeOutreaches}
          workersLoading={team.isLoading}
        />
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-white/10">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? "Saving…" : contact ? "Save changes" : "Add contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
