"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import Loader from "@/components/ui/feedback/Loader";
import { useIsLoggedIn } from "@/components/home/NavUserBadge";
import { usePublicHosts } from "@/lib/api/one-on-one-public";
import { errorText } from "@/components/pray-watch/shared";
import { HostCard } from "@/components/dashboard/one-on-one/member/OneOnOneScreen";
import BookingPanel from "@/components/dashboard/one-on-one/member/BookingPanel";
import { browserTimeZone } from "@/components/dashboard/one-on-one/member/parts";
import VisitorRequestForm from "./VisitorRequestForm";

type Step =
  | { kind: "pick" }
  | { kind: "time"; hostId: string; typeId: string }
  | { kind: "details"; hostId: string; typeId: string; slot: { startsAt: string; endsAt: string } }
  | { kind: "sent"; email: string; hostName: string };

/**
 * The public request flow. With a `slug` (from a pastor's share link) it
 * opens straight on that pastor's calendar. Signed-in members are sent to
 * their dashboard instead, where their details are already known.
 */
export default function VisitorFlow({ slug }: { slug?: string }) {
  const router = useRouter();
  const loggedIn = useIsLoggedIn();
  const hosts = usePublicHosts();
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [timeZone, setTimeZone] = useState("Africa/Lagos");
  useEffect(() => setTimeZone(browserTimeZone()), []);

  useEffect(() => {
    if (loggedIn) router.replace(slug ? `/dashboard/one-on-one?host=${encodeURIComponent(slug)}` : "/dashboard/one-on-one");
  }, [loggedIn, router, slug]);

  const list = hosts.data ?? [];
  const linked = slug ? list.find((h) => h.slug === slug) : undefined;

  useEffect(() => {
    if (linked && step.kind === "pick" && linked.sessionTypes[0]) {
      setStep({ kind: "time", hostId: linked.id, typeId: linked.sessionTypes[0].id });
    }
    // Only on first arrival from the link; going "back" should show everyone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linked?.id]);

  if (loggedIn !== false || hosts.isLoading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader />
      </div>
    );
  }
  if (hosts.isError) return <p className="text-sm font-semibold text-red-700">{errorText(hosts.error, "Couldn’t load this page. Please refresh.")}</p>;

  const find = (id: string) => list.find((h) => h.id === id);
  const indexOf = (id: string) => Math.max(0, list.findIndex((h) => h.id === id));

  if (step.kind === "sent") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4 rounded-2xl border border-[#E7CDD3]/60 bg-white p-8 dark:border-white/[0.09] dark:bg-white/[0.05]">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
          <MailCheck size={22} aria-hidden="true" />
        </span>
        <h2 className="font-serif text-3xl font-bold text-[#111] dark:text-white">Check your email</h2>
        <p className="text-[15px] text-[#3B2A2E] dark:text-white/80">
          We’ve sent a link to <strong className="break-all">{step.email}</strong>. Tap it within 30 minutes to confirm your request, and {step.hostName} will see
          it. If it doesn’t arrive in a few minutes, check your spam folder.
        </p>
        <p className="text-sm text-[#7A6A6F] dark:text-white/55">The same link lets you see, change or withdraw your request later, so keep the email.</p>
      </div>
    );
  }

  if (step.kind === "time" && find(step.hostId)) {
    const host = find(step.hostId)!;
    return (
      <BookingPanel
        host={host}
        hostIndex={indexOf(host.id)}
        sessionTypeId={step.typeId}
        audience="visitor"
        timeZone={timeZone}
        backLabel={list.length > 1 ? "All pastors" : "Back"}
        onBack={() => setStep({ kind: "pick" })}
        onNext={(slot) => setStep({ kind: "details", hostId: host.id, typeId: step.typeId, slot })}
      />
    );
  }

  if (step.kind === "details" && find(step.hostId)) {
    const host = find(step.hostId)!;
    return (
      <div className="max-w-2xl">
        <VisitorRequestForm
          host={host}
          sessionTypeId={step.typeId}
          slot={step.slot}
          timeZone={timeZone}
          onBack={() => setStep({ kind: "time", hostId: host.id, typeId: step.typeId })}
          onSent={(email) => setStep({ kind: "sent", email, hostName: host.displayName })}
        />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <p className="max-w-xl rounded-2xl border border-[#E7CDD3]/60 bg-white p-6 text-[15px] text-[#3B2A2E] dark:border-white/[0.09] dark:bg-white/[0.05] dark:text-white/80">
        The pastors aren’t taking new requests from visitors right now. Please check back soon, or reach the church office through the contact page.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {slug && !linked && <p className="text-sm text-[#7A6A6F]">That pastor isn’t taking visitor requests right now. You’re welcome to request time with another pastor.</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((h, i) => (
          <HostCard key={h.id} host={h} index={i} onChoose={(typeId) => setStep({ kind: "time", hostId: h.id, typeId })} />
        ))}
      </div>
    </div>
  );
}
