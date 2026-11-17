"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRoutingOptions, useRoutingRules, useSaveRoutingRule, type RoutingRule } from "@/lib/api/routing-rules";
import { SEGMENTS } from "@/lib/follow-up/routing-schema";
import RoutingRuleForm from "./RoutingRuleForm";

const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]";

function RuleCard({ rule, onEdit }: { rule: RoutingRule; onEdit: () => void }) {
  const save = useSaveRoutingRule();
  const segment = SEGMENTS[rule.segment as keyof typeof SEGMENTS];
  return (
    <article className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[#111] dark:text-white">{rule.name}</h2>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-white/60">{segment?.hint ?? rule.segment}</p>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-white/60">Under {rule.unitName ?? "an unknown unit"}, whose lead approves</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={rule.active}
          disabled={save.isPending}
          onClick={() => save.mutate({ id: rule.id, update: { active: !rule.active } })}
          className={`h-9 rounded-full px-4 text-xs font-semibold ${rule.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-white/[0.07] dark:text-white/55"}`}
        >
          {rule.active ? "On" : "Off"}
        </button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {rule.pool.map((p) => (
          <li key={p.memberId} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700 dark:bg-white/[0.07] dark:text-white/75">
            {p.name}, {p.openLoad} open{p.active ? "" : " (inactive, skipped)"}
          </li>
        ))}
        {rule.pool.length === 0 && <li className="text-sm text-gray-500">Nobody in the pool yet, so nobody is routed.</li>}
      </ul>
      <button type="button" onClick={onEdit} className="mt-4 text-sm font-semibold text-[#87102C] hover:text-[#6E0C24] dark:text-[#e8768a]">
        Edit
      </button>
    </article>
  );
}

/**
 * Follow-up routing: which new first-timers go to whom. A rule applies to new
 * registrations only, and an admin assigning someone by hand always wins.
 */
export default function RoutingRulesAdmin() {
  const rules = useRoutingRules();
  const options = useRoutingOptions();
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-0">
      <header>
        <h1 className="text-xl font-bold text-[#111] dark:text-white">Follow-up routing</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          New first-timers who match a rule go straight to the person in its pool with the fewest open follow-ups. Assigning someone by hand always wins.
        </p>
      </header>
      {(rules.isLoading || options.isLoading) && <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.05]" aria-label="Loading" />}
      {rules.data && options.data && (
        <>
          {rules.data.map((rule) =>
            editing === rule.id ? (
              <div key={rule.id} className={card}>
                <RoutingRuleForm rule={rule} options={options.data} onDone={() => setEditing(null)} />
              </div>
            ) : (
              <RuleCard key={rule.id} rule={rule} onEdit={() => setEditing(rule.id)} />
            ),
          )}
          {rules.data.length === 0 && editing !== "new" && (
            <p className="rounded-2xl border border-dashed border-gray-300 px-5 py-8 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
              No routing rules yet. Every new first-timer goes to the Follow-Up team as before.
            </p>
          )}
          {editing === "new" ? (
            <div className={card}>
              <RoutingRuleForm options={options.data} onDone={() => setEditing(null)} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white/85"
            >
              <Plus size={16} aria-hidden="true" /> Add a rule
            </button>
          )}
        </>
      )}
    </div>
  );
}
