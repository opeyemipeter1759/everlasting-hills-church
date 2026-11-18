"use client";

import { useEffect, useState } from "react";
import { usePipeline } from "@/lib/api/pipeline";
import { Select } from "@/components/ui/select";
import { useOpeningPreview } from "@/lib/api/opening-message";
import type { TemplateDraft } from "@/lib/messages/opening-template";

function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

const TAB = "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors";

/** The draft filled in for a real first-timer, as WhatsApp and email will show it, updating as you type. */
export function TemplatePreview({ draft }: { draft: TemplateDraft }) {
  const [search, setSearch] = useState("");
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [tab, setTab] = useState<"whatsapp" | "email">("whatsapp");
  const people = usePipeline({ search: useDebounced(search, 300), take: 8, sort: "newest" });
  const rows = people.data?.rows ?? [];
  const preview = useOpeningPreview(visitorId, useDebounced(draft, 400));

  const firstId = rows[0]?.visitorId ?? null;
  useEffect(() => {
    if (!visitorId && firstId) setVisitorId(firstId);
  }, [firstId, visitorId]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04] sm:p-5" aria-label="Preview">
      <h2 className="text-sm font-semibold text-[#111] dark:text-white">Preview</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find a first-timer"
          aria-label="Find a first-timer to preview with"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-white/15 dark:bg-white/5 dark:text-white sm:text-sm"
        />
        <Select
          value={visitorId ?? ""}
          onChange={(v) => setVisitorId(v || null)}
          aria-label="First-timer to preview with"
          placeholder={rows.length === 0 ? "No first-timers found" : "Pick a first-timer"}
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-white/15 dark:bg-[#1b1b1d] dark:text-white sm:text-sm"
          options={rows.map((r) => ({ value: r.visitorId, label: `${r.firstName} ${r.lastName}` }))}
        />
      </div>

      <div className="mt-3 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/[0.06]" role="tablist">
        {(["whatsapp", "email"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`${TAB} ${tab === t ? "bg-white text-[#111] shadow-sm dark:bg-white/15 dark:text-white" : "text-gray-600 dark:text-white/55"}`}
          >
            {t === "whatsapp" ? "WhatsApp" : "Email"}
          </button>
        ))}
      </div>

      {!visitorId && <p className="mt-4 text-sm text-gray-500 dark:text-white/50">Pick a first-timer to see the message as they will.</p>}
      {visitorId && preview.isError && <p className="mt-4 text-sm text-gray-500 dark:text-white/50">The preview could not be loaded.</p>}
      {visitorId && preview.data && tab === "whatsapp" && (
        <div className="mt-4 rounded-2xl bg-[#E9F8EE] p-3 dark:bg-emerald-500/[0.08]">
          <p className="max-w-[90%] whitespace-pre-line rounded-xl rounded-tl-none bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm dark:bg-[#1f2c24] dark:text-white/90">
            {preview.data.whatsapp.text || "Write a WhatsApp message to see it here."}
          </p>
          <p className="mt-1.5 text-right text-[11px] text-gray-500 dark:text-white/45">{preview.data.whatsapp.length} characters</p>
        </div>
      )}
      {visitorId && preview.data && tab === "email" && (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
          <p className="border-b border-gray-200 bg-gray-50 px-3.5 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/85">
            <span className="text-gray-500 dark:text-white/45">Subject: </span>
            {preview.data.email.subject}
          </p>
          <iframe title="Email preview" srcDoc={preview.data.email.html} sandbox="" className="h-[480px] w-full bg-white" />
        </div>
      )}
    </section>
  );
}
