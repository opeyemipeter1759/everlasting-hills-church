"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import type { CaseDetail } from "@/lib/api/premarital";
import { STATUS_LABEL } from "@/lib/pre-marital/schema";
import { card, input, primary, secondary, selectBox, useRun } from "../ui";

/** Moving the case on. Only the moves the status machine allows are offered. */
export function StatusPanel({ c }: { c: CaseDetail }) {
  const { run, pending } = useRun();
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  if (!c.can.transitions.length && !c.can.requestInfo) return null;
  const options = c.can.transitions.filter((s) => s !== "ADDITIONAL_INFORMATION_REQUIRED").map((s) => ({ value: s, label: STATUS_LABEL[s] }));

  async function move() {
    if (!to) return;
    if (await run("post", `/premarital/applications/${c.id}/transitions`, { to, reason: reason || null }, `Moved to ${STATUS_LABEL[to as keyof typeof STATUS_LABEL].toLowerCase()}`)) {
      setTo("");
      setReason("");
    }
  }

  return (
    <section aria-labelledby="status-heading" className={card}>
      <h2 id="status-heading" className="text-base font-bold text-[#111] dark:text-white">Move this case on</h2>
      {options.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]">
          <Select value={to} onChange={setTo} options={options} placeholder="Choose the next step" aria-label="Next status" className={selectBox} />
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Reason (optional, for the team)" aria-label="Reason" className={input} />
          <button type="button" className={primary} disabled={!to || pending} onClick={move}>
            Move
          </button>
        </div>
      )}
      {c.can.requestInfo && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={secondary}
            disabled={pending}
            onClick={() => run("post", `/premarital/applications/${c.id}/request-info`, { reason: reason || null }, "The couple has been asked for more information")}
          >
            Ask the couple for more information
          </button>
          <span className="text-xs text-gray-600 dark:text-white/55">They get a short email; your reason stays with the team.</span>
        </div>
      )}
    </section>
  );
}
