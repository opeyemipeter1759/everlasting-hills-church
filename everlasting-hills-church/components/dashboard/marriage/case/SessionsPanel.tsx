"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import type { CaseDetail, Session } from "@/lib/api/premarital";
import { card, input, lagosDateTime, secondary, selectBox, useRun } from "../ui";
import { BookSession } from "./BookSession";

const ATTENDANCE = [
  { value: "UNMARKED", label: "Not marked" },
  { value: "BOTH_PRESENT", label: "Both came" },
  { value: "ONE_PRESENT", label: "One came" },
  { value: "ABSENT", label: "Neither came" },
];
const STATUS_WORD = { SCHEDULED: "Booked", COMPLETED: "Held", CANCELLED: "Cancelled", RESCHEDULED: "Moved" } as const;

/** Sessions for this case, with booking, moving, cancelling and attendance for those allowed. */
export function SessionsPanel({ c }: { c: CaseDetail }) {
  const shown = c.sessions.filter((s) => s.status !== "RESCHEDULED");
  return (
    <section aria-labelledby="sessions-heading" className={card}>
      <h2 id="sessions-heading" className="text-base font-bold text-[#111] dark:text-white">Sessions</h2>
      {shown.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-white/60">No sessions yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/[0.06]">
          {shown.map((s) => (
            <SessionRow key={s.id} s={s} canManage={c.can.sessions} />
          ))}
        </ul>
      )}
      {c.can.sessions && ["ACCEPTED_FOR_COUNSELLING", "IN_COUNSELLING", "FINAL_REVIEW"].includes(c.status) && <BookSession caseId={c.id} />}
    </section>
  );
}

function SessionRow({ s, canManage }: { s: Session; canManage: boolean }) {
  const { run, pending } = useRun();
  const [moving, setMoving] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="text-sm text-[#111] dark:text-white/90">
          <p className="font-semibold">{lagosDateTime(s.scheduledAt)}</p>
          <p className="text-gray-600 dark:text-white/60">
            {s.format === "ONLINE" ? "Online" : s.location} · {s.durationMinutes} min
            {s.counsellorName ? ` · ${s.counsellorName}` : ""}
          </p>
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-white/70">{STATUS_WORD[s.status]}</span>
      </div>
      {canManage && s.status !== "CANCELLED" && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Select value={s.attendance} onChange={(v) => run("put", `/premarital/sessions/${s.id}/attendance`, { attendance: v }, "Attendance saved")} options={ATTENDANCE} aria-label="Who came" disabled={pending} className={selectBox} />
          </div>
          {s.status === "SCHEDULED" && (
            <>
              <button type="button" className={secondary} onClick={() => setMoving((m) => !m)}>Move</button>
              <button type="button" className={secondary} disabled={pending} onClick={() => run("post", `/premarital/sessions/${s.id}/cancel`, {}, "Session cancelled")}>Cancel</button>
            </>
          )}
        </div>
      )}
      {moving && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="New date" className={`${input} w-auto`} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="New time (Lagos)" className={`${input} w-auto`} />
          <button
            type="button"
            className={secondary}
            disabled={!date || !time || pending}
            onClick={async () => (await run("post", `/premarital/sessions/${s.id}/reschedule`, { date, time }, "Session moved")) && setMoving(false)}
          >
            Save new time
          </button>
        </div>
      )}
    </li>
  );
}
