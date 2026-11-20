"use client";

import { useModules, type CaseDetail } from "@/lib/api/premarital";
import { card, useRun } from "../ui";

/** The curriculum modules this couple has worked through. */
export function ProgressPanel({ c }: { c: CaseDetail }) {
  const modules = useModules();
  const { run, pending } = useRun();
  const done = new Set(c.Progress.map((p) => p.moduleId));
  const active = (modules.data ?? []).filter((m) => m.active || done.has(m.id));
  if (!active.length) return null;
  return (
    <section aria-labelledby="progress-heading" className={card}>
      <h2 id="progress-heading" className="text-base font-bold text-[#111] dark:text-white">
        Progress <span className="text-sm font-normal text-gray-600 dark:text-white/55">({done.size} of {active.length})</span>
      </h2>
      <ul className="mt-3 space-y-1">
        {active.map((m) => (
          <li key={m.id}>
            <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-[#111] hover:bg-gray-50 dark:text-white/90 dark:hover:bg-white/[0.04]">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#87102C]"
                checked={done.has(m.id)}
                disabled={!c.can.progress || pending}
                onChange={(e) =>
                  run(e.target.checked ? "put" : "delete", `/premarital/applications/${c.id}/progress/${m.id}`, undefined, e.target.checked ? `${m.title} marked done` : `${m.title} marked not done`)
                }
              />
              {m.title}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
