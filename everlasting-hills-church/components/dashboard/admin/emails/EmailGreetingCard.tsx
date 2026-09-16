"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, MessageSquareText, RotateCcw } from "lucide-react";
import { useEmailSettings, useUpdateEmailSettings } from "@/lib/api/emails";
import { showToast } from "@/components/ui/toast/toast";

/** Quick picks; anything else can be typed in the box. */
const PRESETS = ["Hello", "Hi", "Dear", "Beloved", "Greetings", "Shalom"];
const MAX_LENGTH = 40;

/** The salutation word every outgoing email opens with — "Hello Daphne,",
 * "Dear Daphne,", "Beloved Daphne,"… Church-wide, same as the header logo:
 * it applies to blasts, announcements and first-timer mails alike. */
export default function EmailGreetingCard() {
  const { data: settings, isLoading, error } = useEmailSettings();
  const update = useUpdateEmailSettings();
  const [draft, setDraft] = useState("");

  // Seed the box from the server once loaded (and after every save).
  useEffect(() => {
    if (settings) setDraft(settings.effectiveGreeting);
  }, [settings]);

  const cleaned = draft.replace(/\s+/g, " ").trim().replace(/[,:;\s]+$/, "");
  const previewWord = cleaned || settings?.defaultGreeting || "Hello";
  const dirty = !!settings && cleaned !== settings.effectiveGreeting;
  const isDefault = !!settings && !settings.greeting;
  const busy = update.isPending;

  function save(word: string | null) {
    update.mutate(
      { greeting: word },
      {
        onSuccess: (data) => showToast.success(`Emails now open with “${data.effectiveGreeting} …,”`),
        onError: (err) => showToast.error((err as Error).message || "Couldn't save the greeting"),
      },
    );
  }

  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-white dark:bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#87102C] to-[#6E0C24]">
          <MessageSquareText size={20} className="text-white/90" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Greeting</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">
              The word every email opens with, followed by the person&apos;s first name.
              {isDefault && " Currently using the default."}
            </p>
          </div>

          {error ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              Couldn&apos;t load the current greeting — {(error as Error).message || "the server returned an error"}. Refresh to try again.
            </p>
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((word) => {
                  const active = word === cleaned;
                  return (
                    <button
                      key={word}
                      type="button"
                      disabled={busy}
                      onClick={() => setDraft(word)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        active
                          ? "border-[#87102C]/40 bg-[#87102C] text-white"
                          : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && dirty && cleaned) save(cleaned);
                  }}
                  maxLength={MAX_LENGTH}
                  placeholder={settings?.defaultGreeting ?? "Hello"}
                  aria-label="Greeting word"
                  className="w-44 rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40"
                />
                <p className="text-sm text-gray-500 dark:text-white/50">
                  Preview:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">{previewWord} Daphne,</span>
                </p>

                <div className="ml-auto flex items-center gap-2">
                  {!isDefault && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => save(null)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={13} /> Reset
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy || !dirty || !cleaned}
                    onClick={() => save(cleaned)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7CDD3] dark:border-white/10 px-3 py-2 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:bg-[#FFF4F6] dark:hover:bg-[#87102C]/15 transition-colors disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save greeting
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
