"use client";

import { Plus, X } from "lucide-react";
import type { ProgramDraft } from "./useProgramDraft";
import { card, hint, input, secondary, sectionTitle } from "./ui";

/** Named parts of each meeting, like the four watches. A part may run past midnight. */
export function SessionsSection({ draft }: { draft: ProgramDraft }) {
  const { sessions, setSessions } = draft;
  const update = (i: number, key: "name" | "startTime" | "endTime", value: string) => setSessions(sessions.map((s, j) => (j === i ? { ...s, [key]: value } : s)));
  return (
    <section id="sessions" className={`${card} space-y-4`} aria-labelledby="sessions-title">
      <div>
        <h2 id="sessions-title" className={sectionTitle}>Sessions</h2>
        <p className={hint}>Optional. The page marks the one that is on now.</p>
      </div>
      <ol className="space-y-2">
        {sessions.map((s, i) => (
          <li key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_8rem_8rem_auto]">
            <input className={input} aria-label={`Session ${i + 1} name`} value={s.name} maxLength={60} placeholder="The Seers" onChange={(e) => update(i, "name", e.target.value)} />
            <input type="time" className={`${input} order-3 sm:order-none`} aria-label={`${s.name || `Session ${i + 1}`} starts`} value={s.startTime} onChange={(e) => update(i, "startTime", e.target.value)} />
            <input type="time" className={`${input} order-4 sm:order-none`} aria-label={`${s.name || `Session ${i + 1}`} ends`} value={s.endTime} onChange={(e) => update(i, "endTime", e.target.value)} />
            <button type="button" className={`${secondary} order-2 sm:order-none`} aria-label={`Remove ${s.name || `session ${i + 1}`}`} onClick={() => setSessions(sessions.filter((_, j) => j !== i))}>
              <X size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className={secondary}
        disabled={sessions.length >= 12}
        onClick={() => {
          const last = sessions[sessions.length - 1];
          setSessions([...sessions, { name: "", startTime: last?.endTime ?? "22:00", endTime: last?.endTime ?? "23:00", description: null }]);
        }}
      >
        <Plus size={15} aria-hidden="true" /> Add a session
      </button>
    </section>
  );
}
