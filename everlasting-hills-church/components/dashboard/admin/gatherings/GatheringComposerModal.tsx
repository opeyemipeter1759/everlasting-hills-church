"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { WEEKDAYS } from "@/lib/gatherings/recurrence";
import { emptyForm, validate, type GatheringFormValues } from "./types";

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#87102C]/40 focus:ring-2 focus:ring-[#87102C]/10 transition-all";

const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5";

const DURATION_PRESETS = [30, 45, 60, 90, 120];

export default function GatheringComposerModal({
  open,
  initialValues,
  isEditing,
  onClose,
  onSubmit,
  saving,
  saveError,
}: {
  open: boolean;
  initialValues: GatheringFormValues;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (values: GatheringFormValues) => void;
  saving: boolean;
  saveError: Error | null;
}) {
  const [values, setValues] = useState<GatheringFormValues>(emptyForm());
  const [showErrors, setShowErrors] = useState(false);

  // Reset from props each time the modal opens, so reopening after a cancel
  // never shows the previous edit's half-typed state.
  useEffect(() => {
    if (!open) return;
    setValues(initialValues);
    setShowErrors(false);
    // initialValues is rebuilt on every render of the parent; keying the reset
    // on `open` alone is what makes it a per-open reset rather than a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof GatheringFormValues>(key: K, value: GatheringFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleDay(code: string) {
    setValues((v) => ({
      ...v,
      byDay: v.byDay.includes(code) ? v.byDay.filter((d) => d !== code) : [...v.byDay, code],
    }));
  }

  const error = validate(values);

  function handleSubmit() {
    if (error) {
      setShowErrors(true);
      return;
    }
    onSubmit(values);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Gathering" : "New Gathering"}
      description={
        isEditing
          ? "Changes apply to every future occurrence, including reminders."
          : "A recurring meeting — the daily prayer call, a midweek study."
      }
      maxWidth="lg"
    >
      <div className="space-y-5">
        <div>
          <label className={labelCls} htmlFor="gathering-title">
            Name
          </label>
          <input
            id="gathering-title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Morning Prayer"
            maxLength={140}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="gathering-description">
            Description <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea
            id="gathering-description"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What happens in this gathering?"
            rows={2}
            maxLength={2000}
            className={`${inputCls} resize-y`}
          />
        </div>

        {/* ── Recurrence ─────────────────────────────────────────────────── */}

        <div>
          <span className={labelCls}>Repeats</span>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-1 w-fit">
            {(["DAILY", "WEEKLY"] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => set("frequency", freq)}
                aria-pressed={values.frequency === freq}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  values.frequency === freq
                    ? "bg-white dark:bg-white/10 text-[#87102C] dark:text-[#e8768a] shadow-sm"
                    : "text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70"
                }`}
              >
                {freq === "DAILY" ? "Every day" : "Weekly"}
              </button>
            ))}
          </div>
        </div>

        {values.frequency === "WEEKLY" && (
          <div>
            <span className={labelCls}>On these days</span>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const selected = values.byDay.includes(day.code);
                return (
                  <button
                    key={day.code}
                    type="button"
                    onClick={() => toggleDay(day.code)}
                    aria-pressed={selected}
                    aria-label={day.label}
                    title={day.label}
                    className={`h-10 w-10 rounded-xl text-xs font-bold transition-all ${
                      selected
                        ? "bg-[#87102C] text-white"
                        : "border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-white/40 hover:border-[#87102C]/40"
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Timing ─────────────────────────────────────────────────────── */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="gathering-start-date">
              Starting from
            </label>
            <input
              id="gathering-start-date"
              type="date"
              value={values.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="gathering-start-time">
              Start time <span className="normal-case font-normal">({values.timezone})</span>
            </label>
            <input
              id="gathering-start-time"
              type="time"
              value={values.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <span className={labelCls}>Runs for</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {DURATION_PRESETS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => set("durationMinutes", minutes)}
                aria-pressed={values.durationMinutes === minutes}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  values.durationMinutes === minutes
                    ? "bg-[#87102C] text-white"
                    : "border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-white/40 hover:border-[#87102C]/40"
                }`}
              >
                {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={1440}
              value={values.durationMinutes}
              onChange={(e) => set("durationMinutes", Number(e.target.value))}
              aria-label="Duration in minutes"
              className={`${inputCls} w-24 px-3 py-2`}
            />
            <span className="text-xs text-gray-400 dark:text-white/30">min</span>
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="gathering-join-url">
            Join link <span className="normal-case font-normal">(optional)</span>
          </label>
          <input
            id="gathering-join-url"
            value={values.joinUrl}
            onChange={(e) => set("joinUrl", e.target.value)}
            placeholder="https://meet.google.com/..."
            className={inputCls}
          />
          <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/30">
            Shown as a Join button on the member dashboard and attached to reminders.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="rounded border-gray-300 text-[#87102C] focus:ring-[#87102C]"
          />
          <span
            className={
              values.isActive
                ? "text-[#87102C] dark:text-[#e8768a] font-medium"
                : "text-gray-400 dark:text-white/40"
            }
          >
            {values.isActive ? "Visible to members" : "Paused — hidden from members"}
          </span>
        </label>

        {/* ── Feedback ───────────────────────────────────────────────────── */}

        {showErrors && error && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <AlertCircle size={14} className="mt-px shrink-0" />
            {error}
          </p>
        )}

        {saveError && (
          <p className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-700 dark:text-red-400">
            <AlertCircle size={14} className="mt-px shrink-0" />
            {saveError.message || "Could not save. Please try again."}
          </p>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || (showErrors && Boolean(error))}
            className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#6E0C24] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isEditing ? "Save changes" : "Create gathering"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
