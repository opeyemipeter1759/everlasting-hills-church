"use client";

import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Gift, Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast/toast";
import {
  useGiftExchange,
  useRegisterGiftExchange,
  useWithdrawGiftExchange,
  type GiftChoice,
} from "@/lib/api/gift-exchange";
import { usePicnicDayLabel } from "@/lib/api/picnic";
import { GiftCountdown, giftDayLabel } from "./GiftCountdown";
import { GIFT_OPTIONS, GiftChoiceForm } from "./GiftChoiceForm";
import { GiftJoinedSummary } from "./GiftJoinedSummary";
import { GiftPartyHeader } from "./GiftPartyHeader";
import { GiftRegisterModal } from "./GiftRegisterModal";
import { bodyText, btnPrimary, btnSecondary, card, linkCl, metaText } from "./tokens";

const failed = (err: unknown) => showToast.error((err as { message?: string }).message ?? "Something went wrong. Please try again.");

/** Each state of the card body fades and slides in when it appears (keyed, so it replays on every swap). */
const swap = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" },
} as const;

/**
 * Picnic & gift exchange: members register from a modal (the picnic includes the gift exchange), then can change or withdraw.
 * Members never see who else is in, or how many. Once in, a countdown appears.
 */
export function GiftExchangeCard() {
  const { data } = useGiftExchange();
  const register = useRegisterGiftExchange();
  const withdraw = useWithdrawGiftExchange();
  const [choosing, setChoosing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const still = useReducedMotion() ?? false;
  const dayLabel = usePicnicDayLabel();
  const saving = register.isPending;
  const closeChooser = useCallback(() => {
    if (!saving) setChoosing(false);
  }, [saving]);
  if (!data) return null;

  const inNow = data.status === "INTERESTED";
  const busy = register.isPending || withdraw.isPending;
  const joined = GIFT_OPTIONS.filter((o) => data[o.key]);
  const view = data.status === "REJECTED" ? "rejected" : !inNow ? "open" : confirming ? "confirm" : "joined";

  const save = (choice: GiftChoice) =>
    register.mutate(choice, {
      onSuccess: () => {
        setChoosing(false);
        showToast.success(inNow ? "Your choice has been updated." : "You're signed up. See you there!");
      },
      onError: failed,
    });

  return (
    <motion.section
      aria-labelledby="gift-exchange-title"
      className={`${card} overflow-hidden`}
      initial={still ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <GiftPartyHeader titleId="gift-exchange-title" kicker="End-of-year fellowship" title="Picnic & gift exchange" dayLabel={dayLabel} />

      <div className="px-5 py-5">
          {view === "rejected" && (
            <motion.p key="rejected" {...swap}
              className="rounded-xl border border-[#E7CDD3] bg-[#FFF5F7] px-4 py-3 text-sm text-[#4a4244] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75">
              Your sign-up wasn&apos;t accepted this time{data.rejectionReason ? `: ${data.rejectionReason}` : "."} Please speak to a
              church admin if you have questions.
            </motion.p>
          )}

          {view === "open" && (
            <motion.div key="open" {...swap} className="flex flex-col gap-4">
              <p className={bodyText}>Close the year with the church family on the grass. The gift exchange happens at the picnic{data.targetDate ? <>, and gift partners are revealed on <strong>{giftDayLabel(data.targetDate)}</strong></> : null}.</p>
              <motion.button
                type="button"
                onClick={() => setChoosing(true)}
                className={`${btnPrimary} relative w-full overflow-hidden shadow-md shadow-[#87102C]/20`}
                whileHover={still ? undefined : { scale: 1.02 }}
                whileTap={still ? undefined : { scale: 0.97 }}
              >
                {!still && (
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                )}
                <Gift size={15} aria-hidden="true" />
                Register
              </motion.button>
            </motion.div>
          )}

          {view === "confirm" && (
            <motion.div key="confirm" {...swap} className="rounded-xl border border-[#E7CDD3] p-4 dark:border-white/10">
              <p className="text-sm font-semibold text-[#111] dark:text-white">Withdraw from the gift exchange &amp; picnic?</p>
              <p className={`mt-1 ${metaText}`}>You can sign up again any time before the day.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy} className={btnPrimary}
                  onClick={() => withdraw.mutate(undefined, { onSuccess: () => setConfirming(false), onError: failed })}>
                  {withdraw.isPending && <Loader2 size={15} className="animate-spin" aria-hidden="true" />} Yes, withdraw
                </button>
                <button type="button" disabled={busy} className={btnSecondary} onClick={() => setConfirming(false)}>
                  Keep me in
                </button>
              </div>
            </motion.div>
          )}

          {view === "joined" && (
            <motion.div key="joined" {...swap} className="flex flex-col gap-4">
              <GiftJoinedSummary joined={joined} />
              {data.targetDate && <GiftCountdown targetDate={data.targetDate} clockOffsetMs={data.clockOffsetMs} />}
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setChoosing(true)} className={linkCl}>
                  Change
                </button>
                <button type="button" onClick={() => setConfirming(true)}
                  className="text-xs font-semibold text-[#8a7e80] hover:underline dark:text-white/45">
                  Withdraw
                </button>
              </div>
            </motion.div>
          )}
      </div>

      <GiftRegisterModal
        open={choosing}
        onClose={closeChooser}
        title={inNow ? "Change your registration" : "Register for the fellowship"}
        subtitle={inNow ? "Switch what you're joining, or keep it as it is." : "Close the year with the church family: one afternoon of food, games and gifts."}
      >
        <GiftChoiceForm
          initial={inNow ? { giftExchange: data.giftExchange, picnic: data.picnic } : { giftExchange: true, picnic: false }}
          changing={inNow}
          saving={saving}
          onSave={save}
          onCancel={closeChooser}
        />
      </GiftRegisterModal>
    </motion.section>
  );
}
