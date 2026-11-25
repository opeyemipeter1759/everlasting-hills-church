"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleNotch, Icon } from "@/components/icons";
import { useSessionReady } from "@/hooks/useSessionReady";
import {
  useGiftExchange,
  useRegisterGiftExchange,
  useWithdrawGiftExchange,
  type GiftExchangeState,
} from "@/lib/api/gift-exchange";
import { PICNIC } from "./picnic-config";
import { ghostBtn, primaryBtn } from "./picnic-styles";
import Countdown from "./PicnicCountdown";

const LOGIN_HREF = `/login?next=${encodeURIComponent(PICNIC.path)}`;
const REGISTER_HREF = `/register?next=${encodeURIComponent(PICNIC.path)}`;

/** The RSVP card on the dark green band. */
export default function PicnicRsvp({ fallbackDate }: { fallbackDate: string }) {
  const { user, ready } = useSessionReady();

  if (!ready) return <div><div className="h-40 animate-pulse rounded-lg bg-white/10" /></div>;

  if (!user?.loggedIn) {
    return (
      <div>
        <Countdown target={fallbackDate} />
        <p className="mt-8 text-[15px] leading-relaxed text-[#F7F0E3]/75">
          Spots are saved for members of the church family. Sign in and it takes one tap — we&apos;ll keep your place.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href={LOGIN_HREF} className={primaryBtn}>
            Sign in to save my spot <Icon icon={ArrowRight} size={16} />
          </Link>
          <Link href={REGISTER_HREF} className={ghostBtn}>
            New here? Create an account
          </Link>
        </div>
      </div>
    );
  }

  return <SignedIn fallbackDate={fallbackDate} />;
}

function SignedIn({ fallbackDate }: { fallbackDate: string }) {
  const { data, isLoading, isError, refetch } = useGiftExchange();
  const register = useRegisterGiftExchange();
  const withdraw = useWithdrawGiftExchange();
  const [alsoGifts, setAlsoGifts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const going = Boolean(data?.registered && data.picnic && data.status !== "REJECTED");
  useEffect(() => {
    if (data?.registered) setAlsoGifts(data.giftExchange);
  }, [data?.registered, data?.giftExchange]);

  if (isLoading) return <div><div className="h-40 animate-pulse rounded-lg bg-white/10" /></div>;
  if (isError || !data) {
    return (
      <div>
        <p className="text-[#F7F0E3]/80">We couldn&apos;t load your spot just now.</p>
        <button type="button" onClick={() => refetch()} className={`${ghostBtn} mt-4`}>Try again</button>
      </div>
    );
  }

  const target = data.targetDate ?? fallbackDate;

  if (data.status === "REJECTED") {
    return (
      <div>
        <Countdown target={target} offsetMs={data.clockOffsetMs} />
        <p className="mt-8 text-[15px] leading-relaxed text-[#F7F0E3]/80">
          Your registration was declined{data.rejectionReason ? `: “${data.rejectionReason}”` : "."} If you think that&apos;s a
          mistake, please speak to the church office.
        </p>
      </div>
    );
  }

  async function join() {
    setError(null);
    try {
      await register.mutateAsync({ picnic: true, giftExchange: alsoGifts });
    } catch (e) {
      setError((e as { message?: string }).message ?? "Something went wrong. Please try again.");
    }
  }

  async function leave(state: GiftExchangeState) {
    setError(null);
    try {
      // Keep their gift exchange place if they had one; otherwise withdraw entirely.
      if (state.giftExchange) await register.mutateAsync({ picnic: false, giftExchange: true });
      else await withdraw.mutateAsync();
    } catch (e) {
      setError((e as { message?: string }).message ?? "Something went wrong. Please try again.");
    }
  }

  const busy = register.isPending || withdraw.isPending;

  return (
    <div>
      <Countdown target={target} offsetMs={data.clockOffsetMs} />

      {going ? (
        <div className="mt-8">
          <p className="flex items-center gap-3 font-serif text-2xl text-[#F7F0E3]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2B33D] text-[#1E3A2A]">
              <Icon icon={Check} size={18} weight="bold" />
            </span>
            You&apos;re on the list.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[#F7F0E3]/70">
            {data.giftExchange ? "Picnic and gift exchange — both saved." : "Your picnic spot is saved."} Now tell your people
            below.
          </p>
          <button type="button" disabled={busy} onClick={() => leave(data)} className="mt-5 text-sm text-[#F7F0E3]/55 underline decoration-[#F7F0E3]/25 underline-offset-4 hover:text-[#F7F0E3]">
            {busy ? "Updating…" : "Can't make it any more?"}
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <label className="flex cursor-pointer items-start gap-3 text-[15px] text-[#F7F0E3]/80">
            <input
              type="checkbox"
              checked={alsoGifts}
              onChange={(e) => setAlsoGifts(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#F2B33D]"
            />
            <span>
              Count me in for the <strong className="font-semibold text-[#F7F0E3]">gift exchange</strong> too
            </span>
          </label>
          <button type="button" disabled={busy} onClick={join} className={`${primaryBtn} mt-6 w-full sm:w-auto`}>
            {busy ? <Icon icon={CircleNotch} size={16} className="animate-spin" /> : null}
            {busy ? "Saving your spot…" : "Count me in"}
            {!busy && <Icon icon={ArrowRight} size={16} />}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-[#FFB4A8]">{error}</p>}
    </div>
  );
}
