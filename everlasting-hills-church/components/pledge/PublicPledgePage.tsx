"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, HandCoins, Mic2, Radio, Video } from "lucide-react";
import PledgeForm, {
  PLEDGE_INTRO,
} from "@/components/dashboard/member/member-home/PledgeForm";
import { formatNaira, pledgePlan, type Pledge } from "@/lib/api/pledges";
import RemittanceAccount from "@/components/pledge/RemittanceAccount";

const longDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

export default function PublicPledgePage() {
  const [saved, setSaved] = useState<Pledge | null>(null);

  return (
    <main className="min-h-screen bg-[#fffaf7] pb-24 pt-16 text-[#211317] md:pt-20">
      <section className="relative isolate overflow-hidden bg-[#3f0615] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_20%,rgba(242,184,75,0.34),transparent_34%),radial-gradient(circle_at_12%_92%,rgba(184,24,47,0.75),transparent_35%),linear-gradient(135deg,#26030d_0%,#650b25_58%,#87102c_100%)]"
        />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-1/2 opacity-15">
          {Array.from({ length: 11 }).map((_, index) => (
            <span
              key={index}
              className="absolute bottom-0 w-2 rounded-t-full bg-[#f2b84b] sm:w-3"
              style={{
                left: `${index * 9}%`,
                height: `${24 + ((index * 37) % 68)}%`,
              }}
            />
          ))}
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-24 pt-16 sm:px-8 sm:pb-32 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#f2b84b] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#3a0612]">
            <HandCoins size={15} aria-hidden="true" />
            Sacrificial giving
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight [text-wrap:balance] sm:text-6xl lg:text-7xl">
            Build the sound of worship with us.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            Make a financial pledge towards the Everlasting Hills Church Sound &amp; Media Project.
            Members, friends, partners and first-time visitors are all welcome to participate.
          </p>
          <ul className="mt-7 flex flex-wrap gap-2 text-sm font-semibold text-white/90">
            {[
              { icon: Mic2, label: "Sound" },
              { icon: Video, label: "Media & recording" },
              { icon: Radio, label: "Streaming" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15">
                <Icon size={15} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pledge-form" className="relative z-10 mx-auto -mt-14 max-w-6xl px-5 sm:-mt-20 sm:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-[#ead8cd] bg-white shadow-2xl shadow-[#3f0615]/10 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="bg-[#fff3e1] p-6 sm:p-9 lg:p-12">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#87102C]">Sound &amp; Media Project</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#261015]">Financial Pledge Form</h2>
            <p className="mt-5 text-sm leading-7 text-[#6d565b]">{PLEDGE_INTRO}</p>

            <RemittanceAccount className="mt-7" />

            <Link href="/give" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#87102C] hover:underline">
              View all church giving accounts <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/pledge/track" className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#87102C] hover:underline">
              Already pledged? Find my tracking link <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="min-w-0 bg-white">
            {saved ? (
              <div role="status" className="flex min-h-[620px] flex-col items-center justify-center p-7 text-center sm:p-12">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={42} aria-hidden="true" />
                </span>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[#87102C]">Pledge received</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-[#211317]">Thank you, {saved.fullName.split(/\s+/)[0]}.</h2>
                <p className="mt-4 text-4xl font-black tabular-nums text-[#87102C]">{formatNaira(saved.amount)}</p>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-[#6d565b]">
                  {pledgePlan(saved)} · expected completion by {longDate(saved.completeBy)}.
                  A confirmation has been sent to {saved.email}.
                </p>
                {saved.trackingToken && (
                  <p className="mt-4 max-w-md rounded-xl bg-[#fff3e1] p-3 text-xs leading-relaxed text-[#765b45]">
                    Your private tracking link is also in your confirmation email. Keep it private and use it whenever you record an installment.
                    If you lose it, <Link href="/pledge/track" className="font-bold underline">ask for it again</Link>.
                  </p>
                )}
                <RemittanceAccount className="mt-5 w-full max-w-md text-left" />
                <Link
                  href={saved.trackingToken ? `/pledge/track/${saved.trackingToken}` : "/dashboard"}
                  className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#87102C] px-7 font-bold text-white hover:bg-[#6f0d24]"
                >
                  {saved.trackingToken ? "Track my installment giving" : "Track giving on my dashboard"}
                </Link>
              </div>
            ) : (
              <PledgeForm
                existing={null}
                prefill={{ fullName: "", phone: "", email: "" }}
                onSaved={setSaved}
                access="public"
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
