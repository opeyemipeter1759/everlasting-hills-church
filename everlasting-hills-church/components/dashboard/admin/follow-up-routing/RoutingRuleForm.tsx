"use client";

import { useState } from "react";
import { useSaveRoutingRule, type RoutingOptions, type RoutingRule } from "@/lib/api/routing-rules";
import { createRoutingRuleSchema, updateRoutingRuleSchema, SEGMENTS, type Segment } from "@/lib/follow-up/routing-schema";
import { firstProblem } from "@/lib/follow-up/first-problem";
import { Select } from "@/components/ui/select";

const field =
  "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#87102C] focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";

/** Add a rule, or edit one: its name, the unit the assignments sit under, and the pool from that unit. */
export default function RoutingRuleForm({ rule, options, onDone }: { rule?: RoutingRule; options: RoutingOptions; onDone: () => void }) {
  const [segment, setSegment] = useState<Segment>("STUDENT");
  const [name, setName] = useState(rule?.name ?? SEGMENTS.STUDENT.label);
  const [unitId, setUnitId] = useState(rule?.unitId ?? "");
  const [pool, setPool] = useState<string[]>(rule?.pool.map((p) => p.memberId) ?? []);
  const [error, setError] = useState<string | null>(null);
  const save = useSaveRoutingRule();
  const unit = options.units.find((u) => u.id === unitId);

  function pickUnit(id: string) {
    setUnitId(id);
    // The pool comes from the unit, so anyone not in the new one drops out.
    const members = new Set(options.units.find((u) => u.id === id)?.members.map((m) => m.id) ?? []);
    setPool((p) => p.filter((m) => members.has(m)));
  }

  const toggle = (id: string) => setPool((p) => (p.includes(id) ? p.filter((m) => m !== id) : [...p, id]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pool.length === 0) return setError("Pick at least one person for the pool");
    if (rule) {
      // Only what changed is sent, so nothing else on the rule is touched.
      const samePool = pool.length === rule.pool.length && pool.every((m) => rule.pool.some((p) => p.memberId === m));
      const update = {
        ...(name.trim() !== rule.name ? { name: name.trim() } : {}),
        ...(unitId !== rule.unitId ? { unitId } : {}),
        ...(!samePool ? { memberIds: pool } : {}),
      };
      const problem = firstProblem(updateRoutingRuleSchema, update);
      setError(problem);
      if (!problem) save.mutate({ id: rule.id, update }, { onSuccess: onDone });
      return;
    }
    const create = { name: name.trim(), segment, unitId, memberIds: pool };
    const problem = firstProblem(createRoutingRuleSchema, create);
    setError(problem);
    if (!problem) save.mutate({ create }, { onSuccess: onDone });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!rule && (
        <label className="block">
          <span className="text-xs font-medium text-gray-600 dark:text-white/55">Who it routes</span>
          <Select
            aria-label="Who it routes"
            value={segment}
            onChange={(v) => {
              const next = v as Segment;
              if (name === SEGMENTS[segment].label) setName(SEGMENTS[next].label);
              setSegment(next);
            }}
            className={field}
            options={(Object.keys(SEGMENTS) as Segment[]).map((s) => ({ value: s, label: `${SEGMENTS[s].label}: ${SEGMENTS[s].hint.toLowerCase()}` }))}
          />
        </label>
      )}
      <label className="block">
        <span className="text-xs font-medium text-gray-600 dark:text-white/55">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={field} />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-gray-600 dark:text-white/55">Unit the assignments sit under (its lead approves)</span>
        <Select
          aria-label="Unit the assignments sit under"
          value={unitId}
          onChange={pickUnit}
          placeholder="Pick a unit"
          className={field}
          options={options.units.map((u) => ({ value: u.id, label: u.name }))}
        />
      </label>
      {unit && (
        <fieldset>
          <legend className="text-xs font-medium text-gray-600 dark:text-white/55">Who shares them (fewest open first)</legend>
          {unit.members.length === 0 && <p className="mt-2 text-sm text-gray-500">This unit has no active members.</p>}
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {unit.members.map((m) => (
              <label key={m.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-gray-200 px-3.5 py-2 text-sm dark:border-white/10 dark:text-white/85">
                <input type="checkbox" checked={pool.includes(m.id)} onChange={() => toggle(m.id)} className="h-4 w-4 accent-[#87102C]" />
                {m.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {error && <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={save.isPending} className="h-11 rounded-xl bg-[#87102C] px-5 text-sm font-semibold text-white hover:bg-[#6E0C24] disabled:opacity-60">
          {save.isPending ? "Saving..." : "Save rule"}
        </button>
        <button type="button" onClick={onDone} className="h-11 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-700 dark:border-white/15 dark:text-white/80">
          Cancel
        </button>
      </div>
    </form>
  );
}
