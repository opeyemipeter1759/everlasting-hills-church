"use client";

import { X } from "lucide-react";
import { useState } from "react";
import Loader from "@/components/ui/feedback/Loader";
import type { EventDetail } from "@/types";
import { useEventForm } from "./useEventForm";
import EventFormBasics from "./EventFormBasics";
import EventFormSchedule from "./EventFormSchedule";
import EventFormLocation from "./EventFormLocation";
import EventFormMedia from "./EventFormMedia";
import EventFormParticipation from "./EventFormParticipation";
import EventFormSections from "./EventFormSections";
import EventFormSeoPublishing from "./EventFormSeoPublishing";

const tabs = [
  ["basic", "Basic"],
  ["schedule", "Date & schedule"],
  ["location", "Location"],
  ["media", "Media"],
  ["participation", "Participation"],
  ["content", "Page content"],
  ["publishing", "SEO & publishing"],
] as const;
type Tab = (typeof tabs)[number][0];

export default function EventForm({
  initial,
  onCancel,
  onSaved,
  defaultStartAt,
}: {
  initial: EventDetail | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
  /** Seeds startAt when the calendar deep-links "add event on this day". */
  defaultStartAt?: string;
}) {
  const { data, set, saving, error, isEdit, submit } = useEventForm(initial, onSaved, defaultStartAt);
  const [activeTab, setActiveTab] = useState<Tab>("basic");

  return (
    <form
      onSubmit={submit}
      className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-4 xs:px-6 xs:pt-6">
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

      <div role="tablist" aria-label="Event editor sections" className="mt-4 flex gap-1 overflow-x-auto border-y border-gray-200 px-4 py-2 dark:border-white/10 xs:px-6">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => setActiveTab(value)}
            className={`min-h-11 flex-none rounded-lg px-3 text-xs font-bold transition-colors ${activeTab === value ? "bg-[#87102C] text-white" : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="space-y-5 p-4 xs:p-6">
        {activeTab === "basic" && <EventFormBasics data={data} set={set} />}
        {activeTab === "schedule" && <EventFormSchedule data={data} set={set} />}
        {activeTab === "location" && <EventFormLocation data={data} set={set} />}
        {activeTab === "media" && <EventFormMedia data={data} set={set} />}
        {activeTab === "participation" && <EventFormParticipation data={data} set={set} />}
        {activeTab === "content" && <EventFormSections data={data} set={set} />}
        {activeTab === "publishing" && <EventFormSeoPublishing data={data} set={set} isEdit={isEdit} />}

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

      <div className="flex items-center gap-3 border-t border-gray-200 pt-5 dark:border-white/10">
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
      </div>
    </form>
  );
}
