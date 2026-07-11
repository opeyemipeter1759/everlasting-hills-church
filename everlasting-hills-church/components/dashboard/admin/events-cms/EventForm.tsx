"use client";

import { X } from "lucide-react";
import Loader from "@/components/ui/feedback/Loader";
import type { EventDetail } from "@/types";
import { useEventForm } from "./useEventForm";
import EventFormBasics from "./EventFormBasics";
import EventFormWhenWhere from "./EventFormWhenWhere";
import EventFormFlyer from "./EventFormFlyer";
import EventFormPeopleContact from "./EventFormPeopleContact";
import EventFormSettings from "./EventFormSettings";

export default function EventForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: EventDetail | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const { data, set, saving, error, isEdit, submit } = useEventForm(initial, onSaved);

  return (
    <form
      onSubmit={submit}
      className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          {isEdit ? "Edit event" : "New event"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Close form"
        >
          <X size={18} />
        </button>
      </div>

      <EventFormBasics data={data} set={set} />
      <EventFormWhenWhere data={data} set={set} />
      <EventFormFlyer data={data} set={set} />
      <EventFormPeopleContact data={data} set={set} />
      <EventFormSettings data={data} set={set} />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving && <Loader size="xs" />}
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create event"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
