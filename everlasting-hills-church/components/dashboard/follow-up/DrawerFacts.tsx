"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { FollowUpPerson } from "@/lib/api/follow-up-pipeline";
import { factsFor } from "./drawer-facts.util";

/**
 * Everything else on record, folded away behind "View details" — the drawer
 * opens on what people act on, and the rest is one tap away. Whatever is
 * missing simply isn't listed, rather than showing rows of dashes.
 */
export function DrawerFacts({ person, isLoading }: { person: FollowUpPerson | null; isLoading: boolean }) {
  const [open, setOpen] = useState(false);

  const toggle = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-[#111] dark:text-white"
    >
      View details
      {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
    </button>
  );
  const shell = "py-4";

  if (!open) return <div className={shell}>{toggle}</div>;

  if (isLoading) {
    return (
      <div className={shell}>
        {toggle}
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className={shell}>
        {toggle}
        <p className="mt-3 text-sm text-gray-500 dark:text-white/45">Couldn&apos;t load these details.</p>
      </div>
    );
  }

  const facts = factsFor(person);

  return (
    <div className={shell}>
      {toggle}
      <dl className="mt-3 divide-y divide-gray-100 rounded-xl bg-gray-50/70 dark:divide-white/[0.06] dark:bg-white/[0.03]">
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
            <dt className="flex-shrink-0 text-xs text-gray-500 dark:text-white/45">{fact.label}</dt>
            <dd className="min-w-0 text-right text-sm font-medium text-[#111] dark:text-white/85">
              {fact.href ? (
                <a href={fact.href} className="break-words hover:text-[#87102C] dark:hover:text-[#FFB3C1]">
                  {fact.value}
                </a>
              ) : (
                <span className="break-words">{fact.value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
