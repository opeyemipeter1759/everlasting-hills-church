"use client";

import { useState } from "react";
import { BookOpen, Languages, Loader2 } from "lucide-react";
import { useDailyScripture, useScriptureVersions } from "@/lib/api/daily-scripture";
import { Select } from "@/components/ui/select";
import HillsConfession from "@/components/sermon-digest/HillsConfession";
import DailySharePanel from "./DailySharePanel";

export default function DailyScriptureCard() {
  const [translationCode, setTranslationCode] = useState("");
  const { data: translations } = useScriptureVersions();
  const { data, isLoading, isError, isFetching, refetch } = useDailyScripture(
    translationCode || undefined,
  );
  // placeholderData keeps the old wording visible while another translation
  // loads. Never let that old image be shared under the newly selected label.
  const translationChanging = Boolean(
    translationCode && data && data.translationCode !== translationCode,
  );

  if (isLoading) {
    return (
      <section
        aria-label="Loading today’s scripture"
        className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"
      >
        <div className="h-4 w-40 rounded bg-gray-100 dark:bg-white/10" />
        <div className="mt-4 h-20 rounded bg-gray-100 dark:bg-white/10" />
      </section>
    );
  }

  if (!data || isError) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-semibold dark:text-white">Scripture for today</h2>
        <p className="mt-2 text-sm text-gray-500">
          Today’s scripture couldn’t load.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 min-h-11 font-semibold text-[#87102C] dark:text-rose-300"
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="daily-scripture-title"
      className="min-w-0 overflow-hidden rounded-2xl border border-[#E7CDD3] bg-white dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="bg-gradient-to-br from-[#220d20] to-[#740d2b] p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="daily-scripture-title"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f5d49a]"
          >
            <BookOpen size={16} aria-hidden="true" />
            Scripture for today
          </h2>
          <time dateTime={data.date} className="text-xs text-white/65">
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            }).format(new Date(`${data.date}T12:00:00Z`))}
          </time>
        </div>
        <blockquote className="mt-4 max-w-3xl break-words font-serif text-xl leading-relaxed sm:text-2xl">
          {data.text}
        </blockquote>
        <p className="mt-4 text-sm font-semibold text-[#f5d49a]">
          {data.reference}{" "}
          <span className="font-normal text-white/65">
            · {data.translationCode}
          </span>
        </p>

        <HillsConfession date={data.date} />
      </div>

      <DailySharePanel
        scripture={data}
        translationChanging={translationChanging}
        versionPicker={
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <Languages size={14} aria-hidden="true" />
              Bible version
              <span className="hidden font-normal text-gray-400 sm:inline">· the image and copied text use it</span>
            </span>
            <span className="relative mt-1.5 block">
              <Select
                aria-label="Bible version for this status"
                value={translationCode || data.translationCode}
                onChange={setTranslationCode}
                disabled={!translations?.length}
                className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#87102C] dark:border-white/15 dark:bg-[#171719] dark:text-white"
                options={[
                  ...(translations?.some((t) => t.code === data.translationCode)
                    ? []
                    : [{ value: data.translationCode, label: data.translationName }]),
                  ...(translations ?? []).map((t) => ({ value: t.code, label: `${t.code} — ${t.name}` })),
                ]}
              />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                {translationChanging || isFetching ? <Loader2 size={15} className="animate-spin" /> : "⌄"}
              </span>
            </span>
            {translationChanging && (
              <span role="status" className="mt-1.5 block text-xs font-medium text-[#87102C] dark:text-rose-300">
                Loading {translationCode} wording…
              </span>
            )}
          </label>
        }
      />
    </section>
  );
}
