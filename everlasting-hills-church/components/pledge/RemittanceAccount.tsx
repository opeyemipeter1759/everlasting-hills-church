"use client";

import { useState } from "react";
import { Building2, Check, Copy } from "lucide-react";
import { SOUND_MEDIA_ACCOUNT } from "@/lib/api/pledges";

/**
 * The account a pledge is redeemed into.
 *
 * Shown wherever someone is about to give or has just recorded giving, so the
 * account number is never more than a tap away — and copyable, because it is
 * typed into a banking app on the same phone.
 */
export default function RemittanceAccount({
  tone = "light",
  className = "",
}: {
  /** "light" sits on the cream public panels; "surface" on white/dark cards. */
  tone?: "light" | "surface";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(SOUND_MEDIA_ACCOUNT.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const shell =
    tone === "light"
      ? "border-[#e6c887] bg-white/70 text-[#3a2018]"
      : "border-[#f2b84b]/60 bg-[#fff8e8] text-gray-900 dark:border-[#f2b84b]/25 dark:bg-[#f2b84b]/10 dark:text-white";

  return (
    <div className={`rounded-2xl border p-4 ${shell} ${className}`}>
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#87102C] dark:text-[#f2c86b]">
        <Building2 size={14} aria-hidden="true" />
        Account to remit to
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="text-xs font-semibold opacity-60">Bank</dt>
          <dd className="font-bold">
            {SOUND_MEDIA_ACCOUNT.bank}{" "}
            <span className="font-medium opacity-70">· {SOUND_MEDIA_ACCOUNT.purpose}</span>
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-2">
          <dt className="text-xs font-semibold opacity-60">Account number</dt>
          <dd className="flex items-center gap-2">
            <span className="text-lg font-black tabular-nums tracking-wide">
              {SOUND_MEDIA_ACCOUNT.accountNumber}
            </span>
            <button
              type="button"
              onClick={copyNumber}
              aria-label="Copy the account number"
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-current/20 px-2 text-xs font-bold text-[#87102C] hover:bg-[#87102C]/5 dark:text-[#f2c86b] dark:hover:bg-white/5"
            >
              {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="text-xs font-semibold opacity-60">Account name</dt>
          <dd className="font-bold">{SOUND_MEDIA_ACCOUNT.accountName}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed opacity-70">
        Give by transfer whenever it suits you, then record what you gave so your pledge stays up to date.
      </p>
    </div>
  );
}
