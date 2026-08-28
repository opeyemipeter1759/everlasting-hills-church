"use client";

import { useState } from "react";
import { DoorOpen } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { Select } from "@/components/ui/select";
import { useFollowUpServices, useQuickCapture } from "@/lib/api/follow-up-pipeline";

function formatServiceOption(s: { name: string; scheduledAt: string }): string {
  const date = new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return `${date} — ${s.name}`;
}

/**
 * Meant for an usher standing at the door mid-service — as few fields as possible,
 * big touch targets, no leader gate (any MEMBER can capture a visitor on the spot).
 */
export function QuickCaptureButton() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");

  const { data: services = [] } = useFollowUpServices();
  const quickCapture = useQuickCapture();

  function reset() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setServiceId("");
  }

  function handleClose() {
    reset();
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) return;
    quickCapture.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(), serviceId: serviceId || undefined },
      { onSuccess: handleClose },
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-[#87102C] dark:text-[#FFB3C1] border border-[#87102C]/30 dark:border-[#FFB3C1]/25 hover:bg-[#FFF4F6] dark:hover:bg-white/5 transition-colors flex-shrink-0"
      >
        <DoorOpen size={15} aria-hidden="true" />
        Quick Add
      </button>

      <Modal open={open} onClose={handleClose} title="Quick Capture" description="For the door, mid-service — just the essentials." maxWidth="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Grace"
                required
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-base px-3 py-3 outline-none focus:ring-2 focus:ring-[#87102C]/25"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Adeyemi"
                required
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-base px-3 py-3 outline-none focus:ring-2 focus:ring-[#87102C]/25"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Phone number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="080…"
              required
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-base px-3 py-3 outline-none focus:ring-2 focus:ring-[#87102C]/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Service <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Select
              aria-label="Service day"
              value={serviceId}
              onChange={setServiceId}
              placeholder="Today's service…"
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-3 text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#87102C]/25"
              options={services.map((s) => ({ value: s.id, label: formatServiceOption(s) }))}
            />
          </div>

          <button
            type="submit"
            disabled={!firstName.trim() || !lastName.trim() || !phone.trim() || quickCapture.isPending}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-[#87102C] hover:bg-[#6E0C24] transition-colors disabled:opacity-50"
          >
            {quickCapture.isPending ? "Capturing…" : "Capture"}
          </button>
        </form>
      </Modal>
    </>
  );
}
