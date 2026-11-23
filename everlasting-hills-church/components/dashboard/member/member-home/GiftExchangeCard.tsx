"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import {
  useGiftExchange,
  useRegisterGiftExchange,
  useWithdrawGiftExchange,
  type GiftChoice,
} from "@/lib/api/gift-exchange";
import { GiftCountdown, giftDayLabel } from "./GiftCountdown";
import { GIFT_OPTIONS, GiftChoiceForm, primaryBtn, quietBtn } from "./GiftChoiceForm";

const failed = (err: unknown) => showToast.error((err as { message?: string }).message ?? "Something went wrong. Please try again.");

/**
 * Gift exchange & picnic: members tick either or both, then can change or withdraw.
 * Members never see who else is in, or how many. Once in, a countdown appears.
 */
export function GiftExchangeCard() {
  const { data } = useGiftExchange();
  const register = useRegisterGiftExchange();
  const withdraw = useWithdrawGiftExchange();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  if (!data) return null;

  const inNow = data.status === "INTERESTED";
  const busy = register.isPending || withdraw.isPending;
  const joined = GIFT_OPTIONS.filter((o) => data[o.key]).map((o) => o.label);

  const save = (choice: GiftChoice) =>
    register.mutate(choice, {
      onSuccess: () => {
        setEditing(false);
        showToast.success(inNow ? "Your choice has been updated." : "You're signed up. See you there!");
      },
      onError: failed,
    });

  return (
    <section
      aria-labelledby="gift-exchange-title"
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
    >
      <header className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1]">
          End-of-year fellowship
        </p>
        <h3 id="gift-exchange-title" className="mt-1 text-lg font-bold text-[#111] dark:text-white">
          Gift exchange &amp; picnic
        </h3>
        {data.targetDate && <p className="mt-0.5 text-sm text-gray-500 dark:text-white/55">{giftDayLabel(data.targetDate)}</p>}
      </header>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        {data.status === "REJECTED" ? (
          <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75">
            Your sign-up wasn&apos;t accepted this time{data.rejectionReason ? `: ${data.rejectionReason}` : "."} Please speak to a
            church admin if you have questions.
          </p>
        ) : !inNow || editing ? (
          <GiftChoiceForm
            initial={inNow ? { giftExchange: data.giftExchange, picnic: data.picnic } : { giftExchange: true, picnic: false }}
            changing={inNow}
            saving={register.isPending}
            onSave={save}
            onCancel={editing ? () => setEditing(false) : undefined}
          />
        ) : confirming ? (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
            <p className="text-sm font-semibold text-[#111] dark:text-white">Withdraw from the gift exchange &amp; picnic?</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-white/50">You can sign up again any time before the day.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy} className={primaryBtn}
                onClick={() => withdraw.mutate(undefined, { onSuccess: () => setConfirming(false), onError: failed })}>
                {withdraw.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} Yes, withdraw
              </button>
              <button type="button" disabled={busy} className={quietBtn} onClick={() => setConfirming(false)}>
                Keep me in
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-white/65">You&apos;re signed up for</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {joined.map((label) => (
                <li key={label}
                  className="rounded-lg border border-[#87102C]/20 bg-[#87102C]/[0.05] px-3 py-1.5 text-sm font-semibold text-[#87102C] dark:border-[#FFB3C1]/30 dark:text-[#FFB3C1]">
                  {label}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-4 text-sm font-semibold">
              <button type="button" onClick={() => setEditing(true)} className="text-[#87102C] hover:underline dark:text-[#FFB3C1]">
                Change
              </button>
              <button type="button" onClick={() => setConfirming(true)} className="text-gray-500 hover:underline dark:text-white/55">
                Withdraw
              </button>
            </div>
          </div>
        )}

        {inNow && !editing && !confirming && data.targetDate && (
          <GiftCountdown targetDate={data.targetDate} clockOffsetMs={data.clockOffsetMs} />
        )}
      </div>
    </section>
  );
}
