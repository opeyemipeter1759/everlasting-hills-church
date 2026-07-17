"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/overlay/Modal";
import Loader from "@/components/ui/feedback/Loader";
import ServiceForm from "./ServiceForm";
import type { ServiceRow } from "./types";
import type { ServicesApi } from "./useServices";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditServiceModal({
  service,
  onClose,
  update,
}: {
  service: ServiceRow | null;
  onClose: () => void;
  update: ServicesApi["update"];
}) {
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [serviceType, setServiceType] = useState("SUNDAY");

  useEffect(() => {
    if (service) {
      setName(service.name);
      setScheduledAt(toLocalInput(service.scheduledAt));
      setServiceType(service.serviceType);
    }
  }, [service]);

  const canSave = name.trim().length >= 3 && scheduledAt && !update.isPending;

  function submit() {
    if (!service) return;
    update.mutate({ id: service.id, input: { name, scheduledAt, serviceType } }, { onSuccess: onClose });
  }

  return (
    <Modal open={!!service} onClose={onClose} title="Edit service">
      <div className="space-y-4">
        <ServiceForm
          name={name}
          onNameChange={setName}
          scheduledAt={scheduledAt}
          onScheduledAtChange={setScheduledAt}
          serviceType={serviceType}
          onServiceTypeChange={setServiceType}
        />
        <button
          onClick={submit}
          disabled={!canSave}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-colors"
        >
          {update.isPending && <Loader size="xs" />}
          {update.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}
