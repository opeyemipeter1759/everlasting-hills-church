"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Contact row — icon + label/value with a hover-revealed copy action.
 * Used inside the "Direct contact" card so Email & Phone share one
 * elevated surface instead of two near-identical chip cards.
 */
export function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  href: string | null;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#87102C] dark:text-[#FFB3C1] mb-0.5">
          {label}
        </p>
        {value ? (
          <a
            href={href ?? undefined}
            className="text-[15px] font-semibold text-[#111] dark:text-white hover:text-[#87102C] dark:hover:text-[#FFB3C1] transition-colors truncate block"
          >
            {value}
          </a>
        ) : (
          <span className="text-[15px] font-normal italic text-[#b8a8ac] dark:text-white/30">Not set</span>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-lg border border-[#E7CDD3]/60 dark:border-white/[0.12] text-[#87102C] dark:text-white/60 hover:bg-[#FFE8ED] dark:hover:bg-white/[0.08] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}
