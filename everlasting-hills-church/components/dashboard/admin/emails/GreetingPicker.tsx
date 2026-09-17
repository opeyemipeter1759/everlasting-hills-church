"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { useEmailSettings } from "@/lib/api/emails";

/** Quick picks; anything else can be typed in the box. */
export const GREETING_PRESETS = ["Hello", "Hi", "Dear", "Beloved", "Greetings", "Shalom"];
const MAX_LENGTH = 40;

/**
 * Chooses the salutation for one particular email — "Dear Daphne,", "Beloved
 * Daphne,"… `null` means "use the church default" (set on the Emails page).
 * Every recipient's first name is appended automatically, so the author never
 * needs to type a greeting line themselves.
 */
export default function GreetingPicker({
  value,
  onChange,
  className = "",
  /** Blasts also fill {{firstName}} placeholders; announcements don't. */
  allowToken = true,
  disabled = false,
}: {
  value: string | null;
  onChange: (greeting: string | null) => void;
  className?: string;
  allowToken?: boolean;
  disabled?: boolean;
}) {
  const { data: settings } = useEmailSettings();
  const churchDefault = settings?.effectiveGreeting ?? "Hello";

  // The raw text in the custom box lives here (so a trailing space doesn't
  // vanish mid-typing); the parent only ever sees a trimmed word or null. A
  // value that arrives from outside (a saved template's "Good morning") and
  // isn't a preset opens the box on its own.
  const [custom, setCustom] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const isCustomValue = value !== null && !GREETING_PRESETS.includes(value);
  const showCustom = customOpen || isCustomValue;
  const customText = custom || (isCustomValue ? value : "");

  const effective = value ?? churchDefault;

  function pick(word: string | null) {
    setCustomOpen(false);
    setCustom("");
    onChange(word);
  }

  function typeCustom(raw: string) {
    setCustom(raw);
    const cleaned = raw.replace(/\s+/g, " ").trim().replace(/[,:;\s]+$/, "");
    onChange(cleaned || null);
  }

  const chipBase = "rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50";
  const chipOn = "border-[#87102C]/40 bg-[#87102C] text-white";
  const chipOff = "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5";

  return (
    <div
      className={`rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-[#FFF4F6] dark:bg-white/[0.03] px-3 py-2.5 space-y-2 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <UserRound size={14} className="shrink-0 text-[#87102C]" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Greeting</span>
        <span className="text-xs text-gray-500 dark:text-white/50">
          Preview: <span className="font-semibold text-gray-900 dark:text-white">{effective} Daphne,</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => pick(null)}
          className={`${chipBase} ${value === null ? chipOn : chipOff}`}
          title="Use the church-wide greeting from the Emails page"
        >
          Default ({churchDefault})
        </button>
        {GREETING_PRESETS.map((word) => (
          <button
            key={word}
            type="button"
            disabled={disabled}
            onClick={() => pick(word)}
            className={`${chipBase} ${!showCustom && value === word ? chipOn : chipOff}`}
          >
            {word}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCustomOpen(true)}
          className={`${chipBase} ${showCustom ? chipOn : chipOff}`}
        >
          Custom…
        </button>
      </div>

      {showCustom && (
        <input
          autoFocus
          value={customText}
          onChange={(e) => typeCustom(e.target.value)}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          placeholder="e.g. Good morning"
          aria-label="Custom greeting word"
          className="w-52 rounded-lg border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 disabled:opacity-50"
        />
      )}

      <p className="text-[11px] leading-relaxed text-gray-500 dark:text-white/45">
        Each person&apos;s first name is added automatically, so there&apos;s no need to write a greeting in the message.
        {allowToken && (
          <>
            {" "}
            To place the name yourself, type{" "}
            <code className="rounded bg-white dark:bg-white/10 px-1 py-0.5 font-mono text-[10px] text-[#87102C]">
              {"{{firstName}}"}
            </code>{" "}
            anywhere in the message.
          </>
        )}
      </p>
    </div>
  );
}
