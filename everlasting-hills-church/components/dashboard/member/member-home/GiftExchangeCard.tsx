"use client";

import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import { useGiftExchange, useRegisterGiftExchange, useWithdrawGiftExchange } from "@/lib/api/gift-exchange";
import { GiftCountdown } from "./GiftCountdown";
import { GiftCardDecor } from "./GiftCardDecor";

const failed = (err: unknown) => showToast.error((err as { message?: string }).message ?? "Something went wrong. Please try again.");
const pill = "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-all disabled:opacity-60";

/**
 * The gift exchange: one button and nothing to fill in, on a gift-wrapped card.
 * Members never see who else is in, or how many. Once in, a countdown appears.
 */
export function GiftExchangeCard() {
  const { data } = useGiftExchange();
  const register = useRegisterGiftExchange();
  const withdraw = useWithdrawGiftExchange();
  const [confirming, setConfirming] = useState(false);
  if (!data) return null;

  const busy = register.isPending || withdraw.isPending;
  const inNow = data.status === "INTERESTED";

  return (
    <section
      aria-label="Gift exchange"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#A3153A] via-[#87102C] to-[#4A0718] text-white shadow-[0_12px_32px_-12px_rgba(135,16,44,0.55)]"
    >
      <GiftCardDecor />

      <div className="relative space-y-5 p-6 pr-24">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
          <Gift size={22} className="text-[#F5C76B]" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#F5C76B]">Gift Exchange</p>
          <h3 className="mt-1 text-xl font-black leading-tight tracking-tight">Give a gift, share the joy</h3>
          <p className="mt-2 text-sm text-white/80">
            {inNow ? "You're part of this year's gift exchange." : "One tap is all it takes to join this year's gift exchange."}
          </p>
        </div>
      </div>

      <div className="relative space-y-5 px-6 pb-6">
        {data.status === "REJECTED" ? (
          <p className="rounded-2xl bg-black/20 px-4 py-3 text-sm text-white/85">
            Your interest wasn&apos;t accepted this time{data.rejectionReason ? `: ${data.rejectionReason}` : "."} Please speak to a church admin if you have questions.
          </p>
        ) : confirming ? (
          <div className="space-y-3 rounded-2xl bg-black/20 p-4">
            <p className="text-sm font-semibold">Withdraw from the gift exchange?</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} className={`${pill} bg-white text-[#87102C] hover:bg-white/90`}
                onClick={() => withdraw.mutate(undefined, { onSuccess: () => setConfirming(false), onError: failed })}>
                {withdraw.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} Yes, withdraw
              </button>
              <button type="button" disabled={busy} className={`${pill} text-white ring-1 ring-white/40 hover:bg-white/10`} onClick={() => setConfirming(false)}>
                Keep me in
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            aria-pressed={inNow}
            onClick={() => (inNow ? setConfirming(true) : register.mutate(undefined, { onError: failed }))}
            className={`${pill} w-full ${
              inNow
                ? "bg-white/15 text-white ring-1 ring-white/40 backdrop-blur-sm hover:bg-white/20"
                : "bg-gradient-to-r from-[#F5C76B] to-[#FFE3A3] text-[#5A0A1E] shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:shadow-xl"
            }`}
          >
            {register.isPending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : !inNow && <Gift size={16} aria-hidden="true" />}
            {inNow ? "You're in ✓" : "I'm interested"}
          </button>
        )}

        {inNow && data.targetDate && <GiftCountdown targetDate={data.targetDate} clockOffsetMs={data.clockOffsetMs} />}
      </div>
    </section>
  );
}
