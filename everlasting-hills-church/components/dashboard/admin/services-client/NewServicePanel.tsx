"use client";

import { useState } from "react";
import Loader from "@/components/ui/feedback/Loader";
import ServiceForm from "./ServiceForm";
import type { ServicesApi } from "./useServices";

export default function NewServicePanel({
  open,
  create,
  onClose,
}: {
  open: boolean;
  create: ServicesApi["create"];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [serviceType, setServiceType] = useState("SUNDAY");

  if (!open) return null;

  const canCreate = name.trim().length >= 3 && scheduledAt && !create.isPending;

  function submit() {
    create.mutate(
      { name, scheduledAt, serviceType },
      {
        onSuccess: () => {
          setName("");
          setScheduledAt("");
          setServiceType("SUNDAY");
          onClose();
        },
      },
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-6 space-y-4">
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
        disabled={!canCreate}
        className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-colors"
      >
        {create.isPending && <Loader size="xs" />}
        {create.isPending ? "Creating..." : "Create Service"}
      </button>
    </div>
  );
}
