"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { useModules } from "@/lib/api/premarital";
import { input, primary, selectBox, useRun } from "../ui";

const FORMAT = [
  { value: "PHYSICAL", label: "In person" },
  { value: "ONLINE", label: "Online" },
];
const LENGTH = ["45", "60", "90", "120"].map((m) => ({ value: m, label: `${m} minutes` }));

/** Book a session. Times are Lagos time; the couple gets an email with the date and time only. */
export function BookSession({ caseId }: { caseId: string }) {
  const { run, pending } = useRun();
  const modules = useModules();
  const [f, setF] = useState({ date: "", time: "", format: "PHYSICAL", location: "", meetingLink: "", duration: "60", moduleId: "" });
  const set = (k: keyof typeof f) => (v: string) => setF((o) => ({ ...o, [k]: v }));
  const where = f.format === "PHYSICAL" ? f.location.trim() : f.meetingLink.trim();
  const moduleOptions = [{ value: "", label: "No particular module" }, ...(modules.data ?? []).filter((m) => m.active).map((m) => ({ value: m.id, label: m.title }))];

  async function book() {
    const body = {
      date: f.date,
      time: f.time,
      format: f.format,
      durationMinutes: Number(f.duration),
      location: f.format === "PHYSICAL" ? f.location : null,
      meetingLink: f.format === "ONLINE" ? f.meetingLink : null,
      moduleId: f.moduleId || null,
    };
    if (await run("post", `/premarital/applications/${caseId}/sessions`, body, "Session booked")) setF((o) => ({ ...o, date: "", time: "" }));
  }

  return (
    <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
      <h3 className="text-sm font-semibold text-[#111] dark:text-white">Book a session</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <input type="date" value={f.date} onChange={(e) => set("date")(e.target.value)} aria-label="Date" className={input} />
        <input type="time" value={f.time} onChange={(e) => set("time")(e.target.value)} aria-label="Time (Lagos)" className={input} />
        <Select value={f.format} onChange={set("format")} options={FORMAT} aria-label="In person or online" className={selectBox} />
        <Select value={f.duration} onChange={set("duration")} options={LENGTH} aria-label="Length" className={selectBox} />
        {f.format === "PHYSICAL" ? (
          <input value={f.location} onChange={(e) => set("location")(e.target.value)} maxLength={200} placeholder="Where, e.g. the church office" aria-label="Where" className={`${input} sm:col-span-2`} />
        ) : (
          <input value={f.meetingLink} onChange={(e) => set("meetingLink")(e.target.value)} maxLength={500} placeholder="Meeting link" aria-label="Meeting link" className={`${input} sm:col-span-2`} />
        )}
        <div className="sm:col-span-2">
          <Select value={f.moduleId} onChange={set("moduleId")} options={moduleOptions} aria-label="Module" className={selectBox} />
        </div>
      </div>
      <button type="button" className={primary} disabled={!f.date || !f.time || !where || pending} onClick={book}>
        Book session
      </button>
    </div>
  );
}
