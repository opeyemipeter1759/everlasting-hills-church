"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";
import { useLogContactAction, type ActionKind, type ContactStatus } from "@/lib/api/evangelism";
import { primaryButton } from "./bits";
import { ACTION_LABEL, STATUS_LABEL, STATUS_ORDER, errorText, inputClass, labelClass, todayLagos } from "./labels";

const OUTCOMES: Record<ActionKind, string[]> = {
  CALL: ["Reached", "No answer", "Switched off", "Wrong number", "Asked to call back"],
  VISIT: ["Visited — met them", "Not at home", "Met family"],
  MESSAGE: ["Sent", "Replied"],
  NOTE: [],
};

/** Log what was done — a call, a visit, a message, a note — and move their status on. */
export function LogActionForm({ contactId, status }: { contactId: string; status: ContactStatus }) {
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
    if (!kind && !nextStatus) return setError("Choose what you did, or a new status.");
    if (nextStatus === "CALL_BACK" && !callBack) return setError("Choose when to call back.");
    const happenedAt = date === todayLagos() ? undefined : new Date(`${date}T12:00:00+01:00`).toISOString();
    try {
      await log.mutateAsync({
        id: contactId,
        ...(kind ? { kind } : {}),
        outcome: outcome.trim() || undefined,
        note: note.trim() || undefined,
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(nextStatus === "CALL_BACK" ? { callBackAt: new Date(`${callBack}T09:00:00+01:00`).toISOString() } : {}),
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
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="What did you do?">
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
            className={`min-h-9 rounded-xl px-3 text-xs font-bold transition-colors ${
              kind === k
                ? "bg-[#87102C] text-white"
                : "border border-gray-200 text-gray-600 hover:border-[#87102C]/40 dark:border-white/10 dark:text-white/70"
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
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                outcome === o
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70"
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
            aria-label="Move status to"
            value={nextStatus}
            onChange={(v) => setNextStatus(v as ContactStatus | "")}
            options={[
              { value: "", label: `Keep: ${STATUS_LABEL[status]}` },
              ...STATUS_ORDER.filter((s) => s !== status).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
            ]}
          />
        </div>
        <div>
          <span className={labelClass}>When</span>
          <input type="date" value={date} max={todayLagos()} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      {nextStatus === "CALL_BACK" && (
        <div>
          <span className={labelClass}>Call back on</span>
          <input type="date" value={callBack} min={todayLagos()} onChange={(e) => setCallBack(e.target.value)} className={inputClass} />
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={log.isPending} className={`${primaryButton} w-full sm:w-auto`}>
        {log.isPending ? "Saving…" : "Log follow-up"}
      </button>
    </form>
  );
}
