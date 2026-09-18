"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import PledgeProgress from "./PledgeProgress";
import { pledgePlan, useTrackedPledge } from "@/lib/api/pledges";
import RemittanceAccount from "@/components/pledge/RemittanceAccount";

export default function PublicPledgeTracker({ token }: { token: string }) {
  const { data: pledge, isLoading, isError, refetch } = useTrackedPledge(token);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf7] px-5 pt-20">
        <Loader2 size={28} className="animate-spin text-[#87102C]" aria-label="Loading pledge progress" />
      </main>
    );
  }

  if (isError || !pledge) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf7] px-5 pt-20">
        <div className="max-w-md rounded-3xl border border-[#ead8cd] bg-white p-8 text-center shadow-xl shadow-[#3f0615]/5">
          <LockKeyhole size={36} className="mx-auto text-[#87102C]" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-black text-[#211317]">Tracking link unavailable</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6d565b]">
This private link is invalid, or a newer one has replaced it. Check the most recent pledge email, or ask for the link again.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            <button type="button" onClick={() => refetch()} className="min-h-11 font-bold text-[#87102C] underline">
              Try again
            </button>
            <Link href="/pledge/track" className="min-h-11 font-bold text-[#87102C] underline">
              Email me my link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf7] px-5 pb-24 pt-28 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/pledge" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#87102C] hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Back to project pledge
        </Link>
        <section className="mt-4 rounded-[2rem] border border-[#ead8cd] bg-gradient-to-br from-[#fff8e8] to-[#fff0f3] p-5 shadow-2xl shadow-[#3f0615]/10 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#87102C]">Sound &amp; Media Project</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#211317] sm:text-3xl">{pledge.fullName}&apos;s pledge</h1>
              <p className="mt-2 text-sm text-[#6d565b]">{pledgePlan(pledge)} · complete by {pledge.completeBy}</p>
            </div>
            <LockKeyhole size={22} className="shrink-0 text-[#87102C]" aria-label="Private tracking page" />
          </div>
          <RemittanceAccount className="mt-5" />
          <PledgeProgress pledge={pledge} target={{ access: "public", token }} />
          <p className="mt-5 text-center text-xs text-[#806970]">This page is private to anyone who has its link.</p>
        </section>
      </div>
    </main>
  );
}
