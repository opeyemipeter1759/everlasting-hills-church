"use client";

import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { X, Compass, Loader2 } from "lucide-react";
import type { HomeCellFormValues } from "./useHomeCells";
import { Select } from "@/components/ui/select";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#87102C]/40 dark:focus:ring-[#e8768a]/30 transition-shadow";

export default function HomeCellModal({
  open, onClose, onSubmit, saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: HomeCellFormValues) => void;
  saving: boolean;
}) {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<HomeCellFormValues>({
    defaultValues: { name: "", leaderPhone: "", meetingDay: "", meetingTime: "", state: "", city: "", addressDetail: "" },
  });

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  if (!open) return null;

  function onOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={onOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/20">
              <Compass size={16} className="text-[#87102C] dark:text-[#e8768a]" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Register Home Cell</h2>
              <p className="text-xs text-gray-400 dark:text-white/35">Cell will be live immediately</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <form id="hc-modal-form" onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Cell Name *" error={errors.name?.message}>
            <input
              {...register("name", { required: "Required" })}
              placeholder="e.g. Grace Light Cell"
              className={inputCls}
            />
          </Field>

          <Field label="Leader WhatsApp Phone *" error={errors.leaderPhone?.message}>
            <input
              {...register("leaderPhone", { required: "Required" })}
              placeholder="+234 801 234 5678"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Meeting Day *" error={errors.meetingDay?.message}>
              <Controller
                control={control}
                name="meetingDay"
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <Select
                    aria-label="Meeting Day"
                    value={field.value}
                    onChange={field.onChange}
                    className={inputCls}
                    placeholder="Select day"
                    options={[
                      { value: "", label: "Select day" },
                      ...DAYS.map((d) => ({ value: d, label: d })),
                    ]}
                  />
                )}
              />
            </Field>

            <Field label="Meeting Time *" error={errors.meetingTime?.message}>
              <input
                {...register("meetingTime", { required: "Required" })}
                placeholder="e.g. 5:00 PM"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="State *" error={errors.state?.message}>
            <Controller
              control={control}
              name="state"
              rules={{ required: "Required" }}
              render={({ field }) => (
                <Select
                  aria-label="State"
                  value={field.value}
                  onChange={field.onChange}
                  className={inputCls}
                  placeholder="Select state"
                  options={[
                    { value: "", label: "Select state" },
                    ...NIGERIAN_STATES.map((s) => ({ value: s, label: s })),
                  ]}
                />
              )}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="City / Area" error={errors.city?.message}>
              <input
                {...register("city")}
                placeholder="e.g. Bodija"
                className={inputCls}
              />
            </Field>

            <Field label="Street / Venue" error={errors.addressDetail?.message}>
              <input
                {...register("addressDetail")}
                placeholder="e.g. 14 University Road"
                className={inputCls}
              />
            </Field>
          </div>
        </form>

        {/* footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="hc-modal-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : "Register Cell"}
          </button>
        </div>
      </div>
    </div>
  );
}
