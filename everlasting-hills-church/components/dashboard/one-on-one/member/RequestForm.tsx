"use client";

import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { SESSION_TOPICS, useCreateRequest, type HostSummary, type MeetingFormat, type SessionTopic } from "@/lib/api/one-on-one";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { btnPrimary } from "../manage/ui";
import { formatWhenLong } from "./parts";

const FORMATS: { value: MeetingFormat; label: string; hint: string }[] = [
  { value: "IN_PERSON", label: "In person", hint: "Church office, Ibadan" },
  { value: "GOOGLE_MEET", label: "Google Meet", hint: "Video call, link sent later" },
  { value: "PHONE", label: "Phone call", hint: "The pastor calls you" },
];

export default function RequestForm({
  host,
  sessionTypeId,
  slot,
  onBack,
  onSent,
}: {
  host: HostSummary;
  sessionTypeId: string;
  slot: { startsAt: string; endsAt: string };
  onBack: () => void;
  onSent: () => void;
}) {
  const create = useCreateRequest();
  const [topic, setTopic] = useState<SessionTopic | null>(null);
  const [note, setNote] = useState("");
  const [format, setFormat] = useState<MeetingFormat>("IN_PERSON");
  const type = host.sessionTypes.find((t) => t.id === sessionTypeId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic) return;
    try {
      await create.mutateAsync({
        hostId: host.id,
        sessionTypeId,
        startsAt: slot.startsAt,
        format,
        topic,
        note: host.notesEnabled ? note.trim() || undefined : undefined,
      });
      showToast.success("Request sent");
      onSent();
    } catch (err) {
      showToast.error(errorText(err, "Couldn't send your request."));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex max-w-2xl flex-col gap-6 rounded-2xl border border-[#E7CDD3]/60 bg-white p-6 dark:border-white/[0.09] dark:bg-white/[0.05]"
    >
      <div className="flex flex-col gap-2">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 self-start text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
          <ArrowLeft size={14} /> Change time
        </button>
        <p className="text-sm tabular-nums text-[#7A6A6F] dark:text-white/55">
          {formatWhenLong(slot.startsAt, slot.endsAt)} · {type?.name} · {host.displayName}
        </p>
        <h2 className="font-serif text-2xl font-bold text-[#111] dark:text-white">A little about the session</h2>
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-sm font-bold text-[#111] dark:text-white">What would you like to talk about?</legend>
        <div className="flex flex-wrap gap-2">
          {SESSION_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                topic === t
                  ? "border-[#87102C] bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/30 dark:text-[#FFB3C1]"
                  : "border-[#E7CDD3] text-[#3B2A2E] hover:bg-[#FFE8ED]/50 dark:border-white/10 dark:text-white/75"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>

      {host.notesEnabled && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-bold text-[#111] dark:text-white">Anything you’d like {host.displayName} to know beforehand (optional)</span>
          <textarea
            id="request-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1500}
            rows={4}
            className="w-full resize-y rounded-xl border border-[#E7CDD3] bg-[#FDF3F5]/60 px-3 py-2.5 text-sm text-[#111] outline-none focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/15 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          />
          <span className="flex items-center gap-1.5 text-xs text-[#7A6A6F] dark:text-white/50">
            <Lock size={12} aria-hidden="true" /> Only {host.displayName} can read this. It’s stored encrypted.
          </span>
        </label>
      )}

      <fieldset>
        <legend className="mb-2.5 text-sm font-bold text-[#111] dark:text-white">How would you like to meet?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={format === f.value}
              onClick={() => setFormat(f.value)}
              className={`rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition ${
                format === f.value
                  ? "border-[#87102C] bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/30 dark:text-[#FFB3C1]"
                  : "border-[#E7CDD3] text-[#3B2A2E] hover:bg-[#FFE8ED]/50 dark:border-white/10 dark:text-white/80"
              }`}
            >
              {f.label}
              <span className="block text-xs font-medium text-[#7A6A6F] dark:text-white/50">{f.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={!topic || create.isPending}>
          {create.isPending ? "Sending…" : "Send request"}
        </button>
        {!topic && <span className="text-xs text-[#7A6A6F] dark:text-white/50">Choose a topic to continue.</span>}
      </div>
    </form>
  );
}
