"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";
import {
  useLogContactAction,
  type ActionKind,
  type ContactStatus,
} from "@/lib/api/evangelism";
import { primaryButton, selectClass } from "./bits";
import {
  ACTION_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  errorText,
  inputClass,
  labelClass,
  todayLagos,
} from "./labels";

const OUTCOMES: Record<ActionKind, string[]> = {
  CALL: [
    "Reached",
    "No answer",
    "Switched off",
    "Wrong number",
    "Asked to call back",
  ],
  VISIT: ["Visited — met them", "Not at home", "Met family"],
  MESSAGE: ["Sent", "Replied"],
  NOTE: [],
};

/** Log what was done — a call, a visit, a message, a note — and move their status on. */
export function LogActionForm({
  contactId,
  status,
}: {
  contactId: string;
  status: ContactStatus;
}) {
  const log = useLogContactAction();
  const [kind, setKind] = useState<ActionKind | "">("CALL");
  const [outcome, setOutcome] = useState("");
  const [note, setNote] = useState("");
  const [nextStatus, setNextStatus] = useState<ContactStatus | "">("");
  const [callBack, setCallBack] = useState("");
  const [date, setDate] = useState(todayLagos());
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!kind && !nextStatus)
      return setError("Choose what you did, or a new status.");
    if (nextStatus === "CALL_BACK" && !callBack)
      return setError("Choose when to call back.");
    const happenedAt =
      date === todayLagos()
        ? undefined
        : new Date(`${date}T12:00:00+01:00`).toISOString();
    try {
      await log.mutateAsync({
        id: contactId,
        ...(kind ? { kind } : {}),
        outcome: outcome.trim() || undefined,
        note: note.trim() || undefined,
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(nextStatus === "CALL_BACK"
          ? { callBackAt: new Date(`${callBack}T09:00:00+01:00`).toISOString() }
          : {}),
        happenedAt,
      });
      showToast.success("Follow-up logged");
      setOutcome("");
      setNote("");
      setNextStatus("");
      setCallBack("");
      setDate(todayLagos());
    } catch (err) {
      setError(errorText(err, "Couldn't log it"));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div
        className="grid grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/[0.06]"
        role="radiogroup"
        aria-label="What did you do?"
      >
        {(Object.keys(ACTION_LABEL) as ActionKind[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => {
              setKind(kind === k ? "" : k);
              setOutcome("");
            }}
            className={`h-9 rounded-lg text-sm font-medium transition-colors ${
              kind === k
                ? "bg-white text-[#87102C] shadow-sm dark:bg-white/15 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white"
            }`}
          >
            {ACTION_LABEL[k]}
          </button>
        ))}
      </div>

      {kind && OUTCOMES[kind].length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {OUTCOMES[kind].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(outcome === o ? "" : o)}
              aria-pressed={outcome === o}
              className={`h-8 rounded-full border px-3 text-xs font-medium transition-colors ${
                outcome === o
                  ? "border-[#87102C] bg-[#87102C] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-transparent dark:text-white/70"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What happened? Prayer points, needs, what they said…"
        aria-label="Note"
        maxLength={4000}
        className={`${inputClass} min-h-[72px] resize-y`}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className={labelClass}>Move status to</span>
          <Select
            className={selectClass}
            aria-label="Move status to"
            value={nextStatus}
            onChange={(v) => setNextStatus(v as ContactStatus | "")}
            options={[
              { value: "", label: `Keep: ${STATUS_LABEL[status]}` },
              ...STATUS_ORDER.filter((s) => s !== status).map((s) => ({
                value: s,
                label: STATUS_LABEL[s],
              })),
            ]}
          />
        </div>
        <div>
          <span className={labelClass}>When</span>
          <input
            type="date"
            value={date}
            max={todayLagos()}
            onChange={(e) => setDate(e.target.value)}
            className={`${inputClass} h-10 py-0`}
          />
        </div>
      </div>

      {nextStatus === "CALL_BACK" && (
        <div>
          <span className={labelClass}>Call back on</span>
          <input
            type="date"
            value={callBack}
            min={todayLagos()}
            onChange={(e) => setCallBack(e.target.value)}
            className={`${inputClass} h-10 py-0`}
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={log.isPending}
          className={`${primaryButton} w-full sm:w-auto`}
        >
          {log.isPending ? "Saving…" : "Log follow-up"}
        </button>
      </div>
    </form>
  );
}
